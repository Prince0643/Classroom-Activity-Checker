export default function AdminRequestsTab({ changeRequests, onApprove, onReject, adminUid }) {
  const pending = changeRequests.filter((r) => r.status === 'pending');

  return (
    <section className="pane">
      <div className="section">
        <div className="section__head">
          <div>
            <div className="section__title">Change Requests</div>
            <div className="section__sub">Review professor requests for schedule changes</div>
          </div>
        </div>

        <div className="schedule">
          {pending.length === 0 ? (
            <div className="cellValue">No pending requests.</div>
          ) : (
            pending.map((r) => (
              <div
                className="scheduleItem"
                key={r.id}
                style={{ gridTemplateColumns: '1.2fr 2fr 2fr 1fr 180px' }}
              >
                <div>
                  <div className="cellTitle">Schedule</div>
                  <div className="cellValue">{r.scheduleId}</div>
                </div>
                <div>
                  <div className="cellTitle">Professor UID</div>
                  <div className="cellValue">{r.professorUid}</div>
                </div>
                <div>
                  <div className="cellTitle">Requested Changes</div>
                  <div className="cellValue" style={{ fontWeight: 500 }}>
                    {JSON.stringify(r.changes || {})}
                  </div>
                </div>
                <div>
                  <div className="cellTitle">Reason</div>
                  <div className="cellValue" style={{ fontWeight: 500 }}>
                    {r.reason || '—'}
                  </div>
                </div>
                <div className="rowActions">
                  <button
                    className="btn btn--dark btn--sm"
                    type="button"
                    onClick={() => onApprove(r, adminUid)}
                  >
                    Approve + Apply
                  </button>
                  <button
                    className="btn btn--light btn--sm"
                    type="button"
                    onClick={() => onReject(r.id, 'rejected', adminUid)}
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
