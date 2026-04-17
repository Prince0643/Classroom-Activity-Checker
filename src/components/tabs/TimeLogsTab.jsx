import React, { useMemo } from 'react';
import StatusTag from '../shared/StatusTag.jsx';

const fmtDate = (iso) => {
  if (!iso) return '';
  const d = new Date(String(iso));
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

export default function TimeLogsTab({
  profile,
  timeLogs,
  scanBusy,
  onOpenScanner,
}) {
  const latest = timeLogs && timeLogs.length ? timeLogs[0] : null;
  const status = latest?.type === 'IN' ? 'In Progress' : 'Scheduled';

  const todayIso = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const todays = (timeLogs || []).filter((l) => l.date === todayIso);
  const todayIn = todays.find((l) => l.type === 'IN') || null;
  const todayOut = [...todays].reverse().find((l) => l.type === 'OUT') || null;

  return (
    <section className="pane">
      <div className="section">
        <div className="section__head">
          <div>
            <div className="section__title">Time Logs</div>
            <div className="section__sub">Scan your QR to time in/out and review your recent logs.</div>
          </div>
        </div>

        <div className="panel panel--blue" style={{ marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 12, opacity: 0.92 }}>Current Status</div>
            <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: 0.4 }}>
              {latest?.type === 'IN' ? 'Clocked In' : 'Not Clocked In'}
            </div>
            <div style={{ fontSize: 13, opacity: 0.86, marginTop: 2 }}>
              {profile?.fullName || profile?.displayName || 'Professor'}
              {latest?.time ? ` • Last: ${latest.type} at ${latest.time}` : ''}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button className="btn btn--light" type="button" onClick={onOpenScanner} disabled={scanBusy}>
              {scanBusy ? 'Scanning…' : 'Scan QR to Time In/Out'}
            </button>
          </div>
        </div>

        <div className="card" style={{ padding: 18, marginTop: 0 }}>
          <div className="section__head" style={{ padding: 0, marginBottom: 10 }}>
            <div>
              <div className="section__title" style={{ fontSize: 16 }}>Today</div>
              <div className="section__sub" style={{ marginTop: 2 }}>Quick summary for today’s logs.</div>
            </div>
          </div>

          <div className="table__row" style={{ margin: 0, gridTemplateColumns: '1fr 1fr 1fr 1fr' }}>
            <div>
              <div className="cellTitle">Time In</div>
              <div className="cellValue">{todayIn?.time || '—'}</div>
            </div>
            <div>
              <div className="cellTitle">Time Out</div>
              <div className="cellValue">{todayOut?.time || '—'}</div>
            </div>
            <div>
              <div className="cellTitle">Schedule</div>
              <div className="cellValue">{todayIn?.scheduleDetails?.subject || todayOut?.scheduleDetails?.subject || '—'}</div>
              <div className="cell--muted">{todayIn?.scheduleDetails?.classroom || todayOut?.scheduleDetails?.classroom || ''}</div>
            </div>
            <div>
              <div className="cellTitle">Status</div>
              <StatusTag status={status} />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="table__head table--wide" style={{ gridTemplateColumns: '1.1fr 1.1fr 1.1fr 1.6fr 1.2fr .9fr' }}>
            <div>Date</div>
            <div>Type</div>
            <div>Time</div>
            <div>Subject</div>
            <div>Room</div>
            <div>Status</div>
          </div>
          <div className="table__body">
            {(timeLogs || []).slice(0, 25).map((log) => (
              <div
                key={log.id}
                className="table__row table--wide"
                style={{ gridTemplateColumns: '1.1fr 1.1fr 1.1fr 1.6fr 1.2fr .9fr' }}
              >
                <div>{fmtDate(log.date)}</div>
                <div>{log.type}</div>
                <div>{log.time || ''}</div>
                <div>{log.scheduleDetails?.subject || '—'}</div>
                <div>{log.scheduleDetails?.classroom || '—'}</div>
                <div><StatusTag status={log.status || 'On Time'} /></div>
              </div>
            ))}
            {!timeLogs?.length && (
              <div style={{ padding: 14, color: '#5b6b85' }}>
                No time logs yet. Scan your QR to create your first entry.
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

