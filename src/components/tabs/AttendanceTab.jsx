import { useMemo, useState } from 'react';

function startOfWeekMonday(date) {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun,1=Mon,...6=Sat
  const diff = day === 0 ? -6 : 1 - day;
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + diff);
  return d;
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function isoDateLocal(date) {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatShort(date) {
  return new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function AttendanceTab({ schedules = [], professors = [], timeLogs = [] }) {
  const [weekOffset, setWeekOffset] = useState(0);

  const { weekStartIso, weekEndIso, rangeLabel } = useMemo(() => {
    const now = new Date();
    const thisWeekStart = startOfWeekMonday(now);
    const start = addDays(thisWeekStart, weekOffset * 7);
    const end = addDays(start, 6);
    const startIso = isoDateLocal(start);
    const endIso = isoDateLocal(end);
    return {
      weekStartIso: startIso,
      weekEndIso: endIso,
      rangeLabel: `${formatShort(start)} – ${formatShort(end)}`,
    };
  }, [weekOffset]);

  const weeklyLogs = useMemo(() => {
    return (timeLogs || []).filter((l) => {
      const d = String(l?.date || '');
      if (!d) return false;
      return d >= weekStartIso && d <= weekEndIso;
    });
  }, [timeLogs, weekStartIso, weekEndIso]);

  const attendanceRows = useMemo(() => {
    const profs = (professors || []).filter((u) => u && u.role === 'professor');
    const schedulesList = Array.isArray(schedules) ? schedules : [];
    const logs = Array.isArray(weeklyLogs) ? weeklyLogs : [];

    // For the week: map professorUid -> Set(scheduleId) that has at least one IN in range.
    const attendedByProf = new Map();
    for (const log of logs) {
      if (!log) continue;
      if (String(log.type || '').toUpperCase() !== 'IN') continue;
      const scheduleId = log.scheduleId;
      if (!scheduleId) continue;
      const professorUid = String(log.professorUid || '').trim();
      if (!professorUid) continue;
      const set = attendedByProf.get(professorUid) || new Set();
      set.add(String(scheduleId));
      attendedByProf.set(professorUid, set);
    }

    const out = profs.map((p) => {
      const uid = String(p.uid || '').trim();
      const profSchedules = schedulesList.filter((s) => String(s?.professorUid || '') === uid);
      const total = profSchedules.length;
      const attendedSet = attendedByProf.get(uid) || new Set();
      // Numerator is schedules that have at least one IN log in this week.
      let attended = 0;
      for (const s of profSchedules) {
        const sid = String(s?.id || '').trim();
        if (sid && attendedSet.has(sid)) attended += 1;
      }
      const pct = total ? Math.round((attended / total) * 100) : 0;
      return {
        uid,
        name: p.displayName || p.fullName || p.email || uid || 'Professor',
        employeeId: p.employeeId || '',
        attended,
        total,
        pct,
      };
    });

    out.sort((a, b) => {
      const aName = String(a.name || '').toLowerCase();
      const bName = String(b.name || '').toLowerCase();
      return aName.localeCompare(bName);
    });
    return out;
  }, [professors, schedules, weeklyLogs]);

  return (
    <section className="pane">
      <div className="section">
        <div className="section__head">
          <div>
            <div className="section__title">Weekly Attendance</div>
            <div className="section__sub">Attendance counted as schedules with at least one IN scan for the week</div>
          </div>
          <div className="rowActions">
            <button className="btn btn--light btn--sm" type="button" onClick={() => setWeekOffset((w) => w - 1)}>
              ← Prev
            </button>
            <div className="cellValue" style={{ minWidth: 140, textAlign: 'center' }}>
              {rangeLabel}
            </div>
            <button className="btn btn--light btn--sm" type="button" onClick={() => setWeekOffset((w) => w + 1)}>
              Next →
            </button>
          </div>
        </div>

        <div className="schedule">
          {attendanceRows.length === 0 ? (
            <div className="cellValue" style={{ padding: 20 }}>
              No professors found.
            </div>
          ) : (
            attendanceRows.map((row) => (
              <div className="scheduleItem" key={row.uid} style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr' }}>
                <div>
                  <div className="cellTitle">Professor</div>
                  <div className="cellValue">
                    {row.name}
                    {row.employeeId ? ` (${row.employeeId})` : ''}
                  </div>
                </div>
                <div>
                  <div className="cellTitle">Week</div>
                  <div className="cellValue">
                    {weekStartIso} to {weekEndIso}
                  </div>
                </div>
                <div>
                  <div className="cellTitle">Attendance</div>
                  <div className="cellValue">
                    {row.attended} / {row.total}
                  </div>
                </div>
                <div>
                  <div className="cellTitle">Rate</div>
                  <div className="cellValue">{row.total ? `${row.pct}%` : '—'}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}

