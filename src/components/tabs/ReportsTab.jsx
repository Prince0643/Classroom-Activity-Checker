import { useState } from 'react';
import { DeleteIcon } from '../shared/Icons.jsx';

export default function ReportsTab({
  reports,
  professors,
  onSubmitReport,
  onDeleteReport,
  submitBusy,
  isAdmin,
  currentUser,
}) {
  const [form, setForm] = useState({
    professorUid: '',
    issue: '',
    details: '',
  });

  const handleSubmit = () => {
    if (!form.professorUid || !form.issue.trim()) {
      alert('Please select a professor and describe the issue');
      return;
    }
    onSubmitReport(form.professorUid, form.issue, form.details);
    setForm({ professorUid: '', issue: '', details: '' });
  };

  const selectedProf = professors.find((p) => p.uid === form.professorUid);

  return (
    <section className="pane">
      <div className="section">
        <div className="section__head">
          <div>
            <div className="section__title">Professor Reports</div>
            <div className="section__sub">Report issues or concerns about professors</div>
          </div>
        </div>

        {/* Submit Report Form */}
        <div className="schedule" style={{ padding: '20px', marginBottom: '20px' }}>
          <div className="scheduleItem" style={{ gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <div className="cellTitle">Professor *</div>
              <select
                className="select"
                value={form.professorUid}
                onChange={(e) =>
                  setForm({ ...form, professorUid: e.target.value })
                }
              >
                <option value="">Select professor</option>
                {professors.map((prof) => (
                  <option key={prof.uid} value={prof.uid}>
                    {prof.displayName || prof.fullName || prof.uid}
                    {prof.employeeId ? ` (${prof.employeeId})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <div className="cellTitle">Employee ID</div>
              <input
                className="input"
                value={selectedProf?.employeeId || ''}
                disabled
                placeholder="Auto-filled"
              />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <div className="cellTitle">Issue *</div>
              <input
                className="input"
                value={form.issue}
                onChange={(e) => setForm({ ...form, issue: e.target.value })}
                placeholder="e.g. Missing class, Late arrival, etc."
              />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <div className="cellTitle">Details</div>
              <textarea
                className="input"
                value={form.details}
                onChange={(e) => setForm({ ...form, details: e.target.value })}
                placeholder="Provide more details about the issue..."
                rows={3}
                style={{ resize: 'vertical', minHeight: '80px' }}
              />
            </div>
            <div className="rowActions" style={{ gridColumn: '1 / -1' }}>
              <button
                className="btn btn--dark btn--sm"
                type="button"
                onClick={handleSubmit}
                disabled={submitBusy}
              >
                {submitBusy ? 'Submitting…' : 'Submit Report'}
              </button>
            </div>
          </div>
        </div>

        {/* Reports List */}
        <div className="section__head" style={{ borderTop: '1px solid rgba(15,23,42,.07)' }}>
          <div>
            <div className="section__title">All Reports</div>
            <div className="section__sub">View submitted reports</div>
          </div>
        </div>

        <div className="schedule">
          {reports.length === 0 ? (
            <div className="cellValue" style={{ padding: 20 }}>
              No reports submitted yet.
            </div>
          ) : (
            reports.map((report) => (
              <div
                className="scheduleItem"
                key={report.id}
                style={{ gridTemplateColumns: '1.5fr 2fr 2fr 1fr 100px' }}
              >
                <div>
                  <div className="cellTitle">Professor</div>
                  <div className="cellValue">
                    {report.professorName || 'Unknown'}
                  </div>
                </div>
                <div>
                  <div className="cellTitle">Issue</div>
                  <div className="cellValue">{report.issue}</div>
                </div>
                <div>
                  <div className="cellTitle">Details</div>
                  <div className="cellValue">{report.details || '—'}</div>
                </div>
                <div>
                  <div className="cellTitle">Reported By</div>
                  <div className="cellValue">{report.reporterName || 'Anonymous'}</div>
                </div>
                <div className="rowActions">
                  {(isAdmin || report.reporterUid === currentUser?.uid) && (
                    <button
                      className="actionBtn actionBtn--danger"
                      type="button"
                      aria-label="Delete"
                      onClick={() => onDeleteReport(report.id)}
                    >
                      <DeleteIcon />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
