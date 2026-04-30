import { useState } from 'react';
import StatusTag from '../shared/StatusTag.jsx';
import Pagination from '../shared/Pagination.jsx';

export default function ApprovalsTab({
  createForm,
  onCreateFormChange,
  onCreateProfessor,
  createBusy,
  createError,
  pendingProfessors,
  allUsers,
  onApprove,
  onRefreshProfessorQr,
  onRefreshAllProfessorQrs,
}) {
  const [activeTab, setActiveTab] = useState('create');
  const [allUsersPage, setAllUsersPage] = useState(1);
  const [pendingPage, setPendingPage] = useState(1);
  const itemsPerPage = 10;

  const professors = allUsers.filter((u) => u.role === 'professor');
  const totalProfessors = professors.length;
  const totalPending = pendingProfessors.length;

  const totalProfPages = Math.ceil(totalProfessors / itemsPerPage);
  const totalPendingPages = Math.ceil(totalPending / itemsPerPage);

  const paginatedProfessors = professors.slice(
    (allUsersPage - 1) * itemsPerPage,
    allUsersPage * itemsPerPage
  );

  const paginatedPending = pendingProfessors.slice(
    (pendingPage - 1) * itemsPerPage,
    pendingPage * itemsPerPage
  );

  return (
    <>
      <div style={{ display: 'flex', gap: 10, marginTop: 12, marginBottom: 16 }}>
        <button
          className={`tab ${activeTab === 'create' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('create')}
          style={{ height: 36 }}
        >
          Create Professor
        </button>
        <button
          className={`tab ${activeTab === 'all' ? 'is-active' : ''}`}
          onClick={() => { setActiveTab('all'); setAllUsersPage(1); }}
          style={{ height: 36 }}
        >
          All Professors ({totalProfessors})
        </button>
        <button
          className={`tab ${activeTab === 'pending' ? 'is-active' : ''}`}
          onClick={() => { setActiveTab('pending'); setPendingPage(1); }}
          style={{ height: 36 }}
        >
          Pending Approvals ({totalPending})
        </button>
      </div>

      {activeTab === 'create' && (
        <div className="section">
          <div className="section__head">
            <div>
              <div className="section__title">Create Professor Account</div>
              <div className="section__sub">Create a new professor account with full details</div>
            </div>
          </div>
          <div className="schedule" style={{ padding: '20px' }}>
            <div className="scheduleItem" style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr' }}>
              <div>
                <div className="cellTitle">Email *</div>
                <input
                  className="input"
                  type="email"
                  value={createForm.email}
                  onChange={(e) => onCreateFormChange({ ...createForm, email: e.target.value })}
                  placeholder="professor@lcu.edu.ph"
                />
              </div>
              <div>
                <div className="cellTitle">Password *</div>
                <input
                  className="input"
                  type="password"
                  value={createForm.password}
                  onChange={(e) => onCreateFormChange({ ...createForm, password: e.target.value })}
                  placeholder="Min 6 characters"
                />
              </div>
              <div>
                <div className="cellTitle">Full Name *</div>
                <input
                  className="input"
                  value={createForm.fullName}
                  onChange={(e) => onCreateFormChange({ ...createForm, fullName: e.target.value })}
                  placeholder="Dr. Maria Santos"
                />
              </div>
              <div>
                <div className="cellTitle">Display Name</div>
                <input
                  className="input"
                  value={createForm.displayName}
                  onChange={(e) => onCreateFormChange({ ...createForm, displayName: e.target.value })}
                  placeholder="Maria"
                />
              </div>
              <div>
                <div className="cellTitle">Employee ID</div>
                <input
                  className="input"
                  value={createForm.employeeId}
                  onChange={(e) => onCreateFormChange({ ...createForm, employeeId: e.target.value })}
                  placeholder="EMP-2026-001"
                />
              </div>
              <div>
                <div className="cellTitle">Department</div>
                <input
                  className="input"
                  value={createForm.department}
                  onChange={(e) => onCreateFormChange({ ...createForm, department: e.target.value })}
                  placeholder="Computer Science"
                />
              </div>
              <div>
                <div className="cellTitle">Phone</div>
                <input
                  className="input"
                  value={createForm.phone}
                  onChange={(e) => onCreateFormChange({ ...createForm, phone: e.target.value })}
                  placeholder="+63 912 345 6789"
                />
              </div>
              <div>
                <div className="cellTitle">Office</div>
                <input
                  className="input"
                  value={createForm.office}
                  onChange={(e) => onCreateFormChange({ ...createForm, office: e.target.value })}
                  placeholder="Room 201, IT Building"
                />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <div className="cellTitle">Specialization</div>
                <input
                  className="input"
                  value={createForm.specialization}
                  onChange={(e) => onCreateFormChange({ ...createForm, specialization: e.target.value })}
                  placeholder="Artificial Intelligence, Machine Learning"
                />
              </div>
              <div className="rowActions" style={{ gridColumn: '1 / -1' }}>
                <button
                  className="btn btn--dark btn--sm"
                  type="button"
                  disabled={!createForm.email || !createForm.password || !createForm.fullName || createBusy}
                  onClick={onCreateProfessor}
                >
                  {createBusy ? 'Creating…' : 'Create Professor Account'}
                </button>
              </div>
              {createError ? (
                <div style={{ gridColumn: '1 / -1', color: '#b91c1c', fontSize: 14, marginTop: 8 }}>
                  {createError}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'all' && (
        <div className="section">
          <div className="section__head">
            <div>
              <div className="section__title">All Professors</div>
              <div className="section__sub">View all registered professors</div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                className="btn btn--dark btn--sm"
                type="button"
                onClick={() => typeof onRefreshAllProfessorQrs === 'function' && onRefreshAllProfessorQrs()}
              >
                Refresh ALL QRs
              </button>
            </div>
          </div>
          <div className="schedule" style={{ padding: '20px' }}>
            {paginatedProfessors.length === 0 ? (
              <div className="cellValue" style={{ padding: 20 }}>No professor accounts found.</div>
            ) : (
              paginatedProfessors.map((p) => (
                <div
                  className="scheduleItem"
                  key={p.uid}
                  style={{ gridTemplateColumns: '1.5fr 1.5fr 1fr 1fr 100px 140px' }}
                >
                  <div>
                    <div className="cellTitle">Full Name</div>
                    <div className="cellValue">{p.fullName || p.displayName || '—'}</div>
                  </div>
                  <div>
                    <div className="cellTitle">Email</div>
                    <div className="cellValue">{p.email || '—'}</div>
                  </div>
                  <div>
                    <div className="cellTitle">Employee ID</div>
                    <div className="cellValue">{p.employeeId || '—'}</div>
                  </div>
                  <div>
                    <div className="cellTitle">Department</div>
                    <div className="cellValue">{p.department || '—'}</div>
                  </div>
                  <div>
                    <div className="cellTitle">Status</div>
                    <StatusTag status={p.approved ? 'completed' : 'scheduled'} />
                  </div>
                  <div className="rowActions" style={{ justifyContent: 'flex-end' }}>
                    <button
                      className="btn btn--dark btn--sm"
                      type="button"
                      onClick={() => typeof onRefreshProfessorQr === 'function' && onRefreshProfessorQr(p.uid)}
                      disabled={!p.uid || p.approved !== true}
                      title={p.approved !== true ? 'Professor must be approved first' : 'Refresh QR token'}
                    >
                      Refresh QR
                    </button>
                  </div>
                </div>
              ))
            )}
            <Pagination
              currentPage={allUsersPage}
              totalPages={totalProfPages}
              onPageChange={setAllUsersPage}
              totalItems={totalProfessors}
            />
          </div>
        </div>
      )}

      {activeTab === 'pending' && (
        <div className="section">
          <div className="section__head">
            <div>
              <div className="section__title">Pending Approvals</div>
              <div className="section__sub">Approve self-registered professor accounts</div>
            </div>
          </div>
          <div className="schedule" style={{ padding: '20px' }}>
            {paginatedPending.length === 0 ? (
              <div className="cellValue" style={{ padding: 20 }}>No pending professor accounts.</div>
            ) : (
              paginatedPending.map((p) => (
                <div className="scheduleItem" key={p.uid} style={{ gridTemplateColumns: '1.6fr 1.6fr 1fr 120px' }}>
                  <div>
                    <div className="cellTitle">UID</div>
                    <div className="cellValue">{p.uid}</div>
                  </div>
                  <div>
                    <div className="cellTitle">Email</div>
                    <div className="cellValue">{p.email || '—'}</div>
                  </div>
                  <div>
                    <div className="cellTitle">Display Name</div>
                    <div className="cellValue">{p.displayName || '—'}</div>
                  </div>
                  <div className="rowActions">
                    <button className="btn btn--dark btn--sm" type="button" onClick={() => onApprove(p.uid, true)}>
                      Approve
                    </button>
                  </div>
                </div>
              ))
            )}
            <Pagination
              currentPage={pendingPage}
              totalPages={totalPendingPages}
              onPageChange={setPendingPage}
              totalItems={totalPending}
            />
          </div>
        </div>
      )}
    </>
  );
}
