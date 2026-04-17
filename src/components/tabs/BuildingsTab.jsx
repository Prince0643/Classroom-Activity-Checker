import { useState } from 'react';
import Pagination from '../shared/Pagination.jsx';
import { DeleteIcon } from '../shared/Icons.jsx';

export default function BuildingsTab({
  buildings,
  classrooms,
  onCreateBuilding,
  onCreateClassroom,
  onDeleteBuilding,
  onDeleteClassroom,
}) {
  const [activeTab, setActiveTab] = useState('buildings');
  const [buildingForm, setBuildingForm] = useState({
    name: '',
    location: '',
  });
  const [classroomForm, setClassroomForm] = useState({
    buildingId: '',
    roomNumber: '',
    facilities: '',
  });
  const [buildingBusy, setBuildingBusy] = useState(false);
  const [classroomBusy, setClassroomBusy] = useState(false);

  const [buildingsPage, setBuildingsPage] = useState(1);
  const [classroomsPage, setClassroomsPage] = useState(1);
  const itemsPerPage = 10;

  const totalBuildings = buildings.length;
  const totalClassrooms = classrooms.length;
  const totalBuildingsPages = Math.ceil(totalBuildings / itemsPerPage);
  const totalClassroomsPages = Math.ceil(totalClassrooms / itemsPerPage);

  const paginatedBuildings = buildings.slice(
    (buildingsPage - 1) * itemsPerPage,
    buildingsPage * itemsPerPage
  );

  const paginatedClassrooms = classrooms.slice(
    (classroomsPage - 1) * itemsPerPage,
    classroomsPage * itemsPerPage
  );

  const handleCreateBuilding = async () => {
    setBuildingBusy(true);
    try {
      const code = 'BLD-' + Date.now().toString(36).toUpperCase();
      await onCreateBuilding({ ...buildingForm, code });
      setBuildingForm({ name: '', location: '' });
    } finally {
      setBuildingBusy(false);
    }
  };

  const handleCreateClassroom = async () => {
    if (!classroomForm.buildingId) {
      alert('Please select a building');
      return;
    }
    const selectedBuilding = buildings.find((b) => b.id === classroomForm.buildingId);
    setClassroomBusy(true);
    try {
      await onCreateClassroom({
        ...classroomForm,
        buildingName: selectedBuilding?.name || '',
      });
      setClassroomForm({ buildingId: '', roomNumber: '', facilities: '' });
    } finally {
      setClassroomBusy(false);
    }
  };

  return (
    <>
      <div style={{ display: 'flex', gap: 10, marginTop: 12, marginBottom: 16 }}>
        <button
          className={`tab ${activeTab === 'buildings' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('buildings')}
          style={{ height: 36 }}
        >
          Buildings ({totalBuildings})
        </button>
        <button
          className={`tab ${activeTab === 'classrooms' ? 'is-active' : ''}`}
          onClick={() => { setActiveTab('classrooms'); setClassroomsPage(1); }}
          style={{ height: 36 }}
        >
          Classrooms ({totalClassrooms})
        </button>
      </div>

      {activeTab === 'buildings' && (
        <div className="section">
          <div className="section__head">
            <div>
              <div className="section__title">Create Building</div>
              <div className="section__sub">Add a new building to the campus</div>
            </div>
          </div>
          <div className="schedule" style={{ padding: '20px' }}>
            <div className="scheduleItem" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <div>
                <div className="cellTitle">Building Name *</div>
                <input
                  className="input"
                  value={buildingForm.name}
                  onChange={(e) => setBuildingForm({ ...buildingForm, name: e.target.value })}
                  placeholder="e.g. IT Building"
                />
              </div>
              <div>
                <div className="cellTitle">Location</div>
                <input
                  className="input"
                  value={buildingForm.location}
                  onChange={(e) => setBuildingForm({ ...buildingForm, location: e.target.value })}
                  placeholder="e.g. North Campus"
                />
              </div>
              <div className="rowActions" style={{ gridColumn: '1 / -1' }}>
                <button
                  className="btn btn--dark btn--sm"
                  type="button"
                  disabled={!buildingForm.name || buildingBusy}
                  onClick={handleCreateBuilding}
                >
                  {buildingBusy ? 'Creating…' : 'Create Building'}
                </button>
              </div>
            </div>
          </div>

          <div className="section__head" style={{ marginTop: 20, borderTop: '1px solid rgba(15,23,42,.07)' }}>
            <div>
              <div className="section__title">All Buildings</div>
              <div className="section__sub">Manage existing buildings</div>
            </div>
          </div>
          <div className="schedule" style={{ padding: '20px' }}>
            {paginatedBuildings.length === 0 ? (
              <div className="cellValue" style={{ padding: 20 }}>No buildings created yet.</div>
            ) : (
              paginatedBuildings.map((b) => (
                <div
                  className="scheduleItem"
                  key={b.id}
                  style={{ gridTemplateColumns: '2fr 2fr 100px' }}
                >
                  <div>
                    <div className="cellTitle">Building Name</div>
                    <div className="cellValue">{b.name || '—'}</div>
                  </div>
                  <div>
                    <div className="cellTitle">Location</div>
                    <div className="cellValue">{b.location || '—'}</div>
                  </div>
                  <div className="rowActions">
                    <button
                      className="actionBtn actionBtn--danger"
                      type="button"
                      aria-label="Delete"
                      onClick={() => onDeleteBuilding(b.id)}
                    >
                      <DeleteIcon />
                    </button>
                  </div>
                </div>
              ))
            )}
            <Pagination
              currentPage={buildingsPage}
              totalPages={totalBuildingsPages}
              onPageChange={setBuildingsPage}
              totalItems={totalBuildings}
            />
          </div>
        </div>
      )}

      {activeTab === 'classrooms' && (
        <div className="section">
          <div className="section__head">
            <div>
              <div className="section__title">Create Classroom</div>
              <div className="section__sub">Add a new classroom to a building</div>
            </div>
          </div>
          <div className="schedule" style={{ padding: '20px' }}>
            <div className="scheduleItem" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <div>
                <div className="cellTitle">Building *</div>
                <select
                  className="select"
                  value={classroomForm.buildingId}
                  onChange={(e) => setClassroomForm({ ...classroomForm, buildingId: e.target.value })}
                >
                  <option value="">Select building</option>
                  {buildings.map((b) => (
                    <option value={b.id} key={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <div className="cellTitle">Room Number *</div>
                <input
                  className="input"
                  value={classroomForm.roomNumber}
                  onChange={(e) => setClassroomForm({ ...classroomForm, roomNumber: e.target.value })}
                  placeholder="e.g. 101"
                />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <div className="cellTitle">Facilities</div>
                <input
                  className="input"
                  value={classroomForm.facilities}
                  onChange={(e) => setClassroomForm({ ...classroomForm, facilities: e.target.value })}
                  placeholder="e.g. Projector, AC, Whiteboard"
                />
              </div>
              <div className="rowActions" style={{ gridColumn: '1 / -1' }}>
                <button
                  className="btn btn--dark btn--sm"
                  type="button"
                  disabled={!classroomForm.buildingId || !classroomForm.roomNumber || classroomBusy}
                  onClick={handleCreateClassroom}
                >
                  {classroomBusy ? 'Creating…' : 'Create Classroom'}
                </button>
              </div>
            </div>
          </div>

          <div className="section__head" style={{ marginTop: 20, borderTop: '1px solid rgba(15,23,42,.07)' }}>
            <div>
              <div className="section__title">All Classrooms</div>
              <div className="section__sub">Manage existing classrooms</div>
            </div>
          </div>
          <div className="schedule" style={{ padding: '20px' }}>
            {paginatedClassrooms.length === 0 ? (
              <div className="cellValue" style={{ padding: 20 }}>No classrooms created yet.</div>
            ) : (
              paginatedClassrooms.map((c) => (
                <div
                  className="scheduleItem"
                  key={c.id}
                  style={{ gridTemplateColumns: '2fr 1.5fr 2fr 100px' }}
                >
                  <div>
                    <div className="cellTitle">Building</div>
                    <div className="cellValue">{c.buildingName || '—'}</div>
                  </div>
                  <div>
                    <div className="cellTitle">Room</div>
                    <div className="cellValue">{c.roomNumber || '—'}</div>
                  </div>
                  <div>
                    <div className="cellTitle">Facilities</div>
                    <div className="cellValue">{c.facilities || '—'}</div>
                  </div>
                  <div className="rowActions">
                    <button
                      className="actionBtn actionBtn--danger"
                      type="button"
                      aria-label="Delete"
                      onClick={() => onDeleteClassroom(c.id)}
                    >
                      <DeleteIcon />
                    </button>
                  </div>
                </div>
              ))
            )}
            <Pagination
              currentPage={classroomsPage}
              totalPages={totalClassroomsPages}
              onPageChange={setClassroomsPage}
              totalItems={totalClassrooms}
            />
          </div>
        </div>
      )}
    </>
  );
}
