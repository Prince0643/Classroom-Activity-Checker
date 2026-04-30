import { ClockIcon } from '../shared/Icons.jsx';
import { formatDayTimeRange } from '../../utils/helpers.js';
import { useEffect, useMemo, useRef, useState } from 'react';

function normalizeBuildingName(name) {
  return String(name || '').trim().toLowerCase();
}

function normalizeRoomNumber(value) {
  return String(value || '').trim().toLowerCase();
}

function shouldIgnoreArrowKeyEvent(target) {
  const el = target;
  if (!el) return false;
  if (el.isContentEditable) return true;
  const tag = String(el.tagName || '').toLowerCase();
  return tag === 'input' || tag === 'textarea' || tag === 'select';
}

function isModalOpen() {
  // Treat only visible app modals as "open" (some modals are always mounted and toggled via `.hidden`).
  return !!document.querySelector('.modal[role="dialog"][aria-modal="true"]:not(.hidden)');
}

function timeToMinutes(t) {
  if (t == null) return null;
  if (typeof t === 'number') {
    const d = new Date(t);
    if (Number.isNaN(d.getTime())) return null;
    return d.getHours() * 60 + d.getMinutes();
  }
  const s = String(t).trim();
  if (!s) return null;
  const m24 = s.match(/^(\d{1,2}):(\d{2})$/);
  if (m24) return Number(m24[1]) * 60 + Number(m24[2]);
  const m12 = s.match(/^(\d{1,2}):(\d{2})\s*([AP]M)$/i);
  if (m12) {
    let h = Number(m12[1]) % 12;
    if (String(m12[3]).toUpperCase() === 'PM') h += 12;
    return h * 60 + Number(m12[2]);
  }
  return null;
}

function pickActiveScheduleForRoom(schedulesForRoom, now = new Date()) {
  const day = now.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'Asia/Manila' });
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const candidates = (schedulesForRoom || [])
    .filter((s) => String(s?.fixed?.day || '') === day)
    .map((s) => ({
      s,
      start: timeToMinutes(s?.fixed?.timeStart),
      end: timeToMinutes(s?.fixed?.timeEnd),
    }))
    .filter((x) => x.start != null && x.end != null && x.start <= nowMins && nowMins <= x.end);
  if (!candidates.length) return null;
  candidates.sort((a, b) => Number(a.start) - Number(b.start));
  return candidates[0].s;
}

function isScheduleOccupied(schedule) {
  const tapInAt = Number(schedule?.live?.tapInAt || 0) || 0;
  const tapOutAt = Number(schedule?.live?.tapOutAt || 0) || 0;
  return tapInAt > 0 && (tapOutAt <= 0 || tapOutAt < tapInAt);
}

export default function PublicScreen({ clock, today, schedules, buildings, classrooms, onScanQr }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [selectedRowIdx, setSelectedRowIdx] = useState(0);
  const slidesRef = useRef([]);
  const selectedRowElRef = useRef(null);

  const slides = useMemo(() => {
    const buildingList = Array.isArray(buildings) ? buildings : [];
    const scheduleList = Array.isArray(schedules) ? schedules : [];
    const classroomList = Array.isArray(classrooms) ? classrooms : [];

    const sortedBuildings = [...buildingList].sort((a, b) => {
      const an = String(a?.name || '').toLowerCase();
      const bn = String(b?.name || '').toLowerCase();
      return an.localeCompare(bn);
    });

    const known = new Map();
    for (const b of sortedBuildings) {
      const n = normalizeBuildingName(b?.name);
      if (!n) continue;
      if (!known.has(n)) known.set(n, b);
    }

    const usedKnown = new Set();
    const unknownSchedules = [];

    const schedulesByBuilding = new Map();
    for (const s of scheduleList) {
      const sBuildingRaw = s?.fixed?.building || '';
      const key = normalizeBuildingName(sBuildingRaw);
      if (key && known.has(key)) {
        usedKnown.add(key);
        const arr = schedulesByBuilding.get(key) || [];
        arr.push(s);
        schedulesByBuilding.set(key, arr);
      } else {
        unknownSchedules.push(s);
      }
    }

    const classroomsByBuildingId = new Map();
    for (const c of classroomList) {
      const buildingId = String(c?.buildingId || '').trim();
      if (!buildingId) continue;
      const arr = classroomsByBuildingId.get(buildingId) || [];
      arr.push(c);
      classroomsByBuildingId.set(buildingId, arr);
    }

    const out = [];
    for (const b of sortedBuildings) {
      const key = normalizeBuildingName(b?.name);
      const buildingId = String(b?.id || '').trim();
      const bClassrooms = buildingId ? classroomsByBuildingId.get(buildingId) || [] : [];
      const sortedClassrooms = [...bClassrooms].sort((a, b2) => {
        const af = Number(a?.floor || 0);
        const bf = Number(b2?.floor || 0);
        if (af !== bf) return af - bf;
        return String(a?.roomNumber || '').localeCompare(String(b2?.roomNumber || ''), undefined, { numeric: true });
      });

      const buildingSchedules = key ? schedulesByBuilding.get(key) || [] : [];
      const schedulesByRoom = new Map();
      for (const s of buildingSchedules) {
        const roomKey = normalizeRoomNumber(s?.fixed?.classroom);
        if (!roomKey) continue;
        const arr = schedulesByRoom.get(roomKey) || [];
        arr.push(s);
        schedulesByRoom.set(roomKey, arr);
      }

      const classroomRows = sortedClassrooms.map((c) => {
        const roomKey = normalizeRoomNumber(c?.roomNumber);
        const candidates = roomKey ? schedulesByRoom.get(roomKey) || [] : [];
        const activeSchedule = pickActiveScheduleForRoom(candidates, new Date());
        return {
          classroom: c,
          schedule: activeSchedule,
        };
      });

      out.push({
        key: key || `__building_${b?.id || ''}`,
        title: b?.name || b?.code || 'Building',
        meta: b?.location || '',
        classrooms: classroomRows,
      });
    }

    if (unknownSchedules.length) {
      out.push({
        key: '__unknown',
        title: 'Unassigned / Unknown',
        meta: '',
        classrooms: [],
      });
    }

    return out;
  }, [buildings, schedules, classrooms]);

  useEffect(() => {
    slidesRef.current = slides;
  }, [slides]);

  useEffect(() => {
    if (!slides.length) {
      setActiveIdx(0);
      setSelectedRowIdx(0);
      return;
    }
    if (activeIdx > slides.length - 1) setActiveIdx(0);
  }, [slides.length, activeIdx]);

  useEffect(() => {
    setSelectedRowIdx(0);
  }, [activeIdx]);

  const activeRows = slides[activeIdx]?.classrooms || [];
  useEffect(() => {
    if (!activeRows.length) {
      setSelectedRowIdx(0);
      return;
    }
    if (selectedRowIdx > activeRows.length - 1) setSelectedRowIdx(activeRows.length - 1);
  }, [activeRows.length, selectedRowIdx]);

  useEffect(() => {
    if (!selectedRowElRef.current) return;
    try {
      selectedRowElRef.current.scrollIntoView({ block: 'nearest' });
    } catch {
      // ignore
    }
  }, [activeIdx, selectedRowIdx]);

  useEffect(() => {
    const onKeyDown = (e) => {
      const isLeft =
        e.key === 'ArrowLeft' ||
        e.key === 'Left' ||
        e.code === 'ArrowLeft' ||
        e.keyCode === 37;
      const isRight =
        e.key === 'ArrowRight' ||
        e.key === 'Right' ||
        e.code === 'ArrowRight' ||
        e.keyCode === 39;
      const isUp =
        e.key === 'ArrowUp' ||
        e.key === 'Up' ||
        e.code === 'ArrowUp' ||
        e.keyCode === 38;
      const isDown =
        e.key === 'ArrowDown' ||
        e.key === 'Down' ||
        e.code === 'ArrowDown' ||
        e.keyCode === 40;

      if (!isLeft && !isRight && !isUp && !isDown) return;
      if (shouldIgnoreArrowKeyEvent(e.target)) return;
      if (isModalOpen()) return;
      const slideLen = slidesRef.current.length;
      if (!slideLen) return;
      e.preventDefault();
      e.stopPropagation();
      if (isLeft) {
        setActiveIdx((i) => (i - 1 + slideLen) % slideLen);
        return;
      }
      if (isRight) {
        setActiveIdx((i) => (i + 1) % slideLen);
        return;
      }

      const rows = slidesRef.current[activeIdx]?.classrooms || [];
      if (!rows.length) return;
      if (isUp) {
        setSelectedRowIdx((i) => (i - 1 + rows.length) % rows.length);
      } else if (isDown) {
        setSelectedRowIdx((i) => (i + 1) % rows.length);
      }
    };
    window.addEventListener('keydown', onKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', onKeyDown, { capture: true });
  }, [activeIdx]);

  const activeSlide = slides[activeIdx] || null;

  return (
    <section className="screen">
      <div className="panel panel--blue">
        <div className="panel__left">
          <div className="timebox">
            <div className="timebox__icon" aria-hidden="true">
              <ClockIcon />
            </div>
            <div>
              <div className="timebox__label">Current Time</div>
              <div className="timebox__value">{clock}</div>
            </div>
          </div>
        </div>
        <div className="panel__right">
          <div className="datebox">
            <div className="datebox__label">Date</div>
            <div className="datebox__value">{today}</div>
          </div>
          {typeof onScanQr === 'function' && (
            <div style={{ marginTop: 10, display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn--light btn--sm" type="button" onClick={onScanQr}>
                Scan QR (Time In/Out)
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="carousel">
          <div className="carousel__head">
            <div className="carousel__title">
              <div className="carousel__titleMain">{activeSlide?.title || 'Buildings'}</div>
              <div className="carousel__titleSub">
                {activeSlide?.meta ? `${activeSlide.meta} • ` : ''}
                {activeSlide ? `${(activeSlide.classrooms || []).length} classroom${(activeSlide.classrooms || []).length === 1 ? '' : 's'}` : ''}
              </div>
            </div>
            <div className="carousel__nav" aria-label="Building navigation">
              <button
                className="btn btn--light btn--sm"
                type="button"
                onClick={() => slides.length && setActiveIdx((i) => (i - 1 + slides.length) % slides.length)}
                disabled={!slides.length}
              >
                ←
              </button>
              <div className="carousel__counter" aria-live="polite">
                {slides.length ? `${activeIdx + 1} / ${slides.length}` : '0 / 0'}
              </div>
              <button
                className="btn btn--light btn--sm"
                type="button"
                onClick={() => slides.length && setActiveIdx((i) => (i + 1) % slides.length)}
                disabled={!slides.length}
              >
                →
              </button>
            </div>
          </div>

          <div className="table table--classrooms">
            <div className="table__head">
              <div>Room</div>
              <div>Capacity</div>
              <div>Facilities</div>
              <div>Today</div>
              <div>Time</div>
              <div>Status</div>
            </div>
            <div className="table__body">
              {activeSlide?.classrooms?.length ? (
                activeSlide.classrooms.map((row, idx) => {
                  const c = row.classroom;
                  const s = row.schedule;
                  const isSelected = idx === selectedRowIdx;
                  return (
                    <div
                      className={`table__row ${isSelected ? 'table__row--selected' : ''}`}
                      key={`${c?.id || idx}`}
                      ref={isSelected ? selectedRowElRef : null}
                    >
                      <div>
                        <div className="cellValue">{c?.roomNumber || ''}</div>
                        <div className="cell--muted">Floor {c?.floor || 1}</div>
                      </div>
                      <div>
                        <div className="cellValue">{Number(c?.capacity || 0) || '—'}</div>
                      </div>
                      <div>
                        <div className="cellValue">{c?.facilities ? String(c.facilities) : '—'}</div>
                      </div>
                      <div>
                        <div className="cellValue">{s ? (s.fixed?.subject || '—') : '—'}</div>
                        <div className="cell--muted">{s ? (s.fixed?.professorName || '') : ''}</div>
                      </div>
                      <div>
                        <div className="cellValue">
                          {s ? formatDayTimeRange(s.fixed?.day, s.fixed?.timeStart, s.fixed?.timeEnd) : '—'}
                        </div>
                      </div>
                      <div>
                        {s ? (
                          <span className={`tag ${isScheduleOccupied(s) ? 'tag--progress' : 'tag--scheduled'}`}>
                            {isScheduleOccupied(s) ? 'Occupied' : 'Available'}
                          </span>
                        ) : (
                          <span className="cell--muted">Available</span>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="emptyState">
                  <div className="emptyState__title">No classrooms in this building.</div>
                  <div className="emptyState__sub">Use ← / → to switch buildings.</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
