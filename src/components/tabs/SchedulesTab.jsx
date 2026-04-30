import { formatDayTimeRange } from '../../utils/helpers.js';
import { DeleteIcon } from '../shared/Icons.jsx';
import StatusTag from '../shared/StatusTag.jsx';

export default function SchedulesTab({
  isAdmin,
  schedules,
  form,
  onFormChange,
  onCreate,
  onDelete,
  onTapIn,
  onTapOut,
  onStatusChange,
  createBusy,
  allUsers,
  buildings,
  classrooms,
}) {
  const professors = allUsers?.filter((u) => u.role === 'professor') || [];
  return (
    <section className="pane">
      <div className="section">
        <div className="section__head">
          <div>
            <div className="section__title">{isAdmin ? 'Schedules' : 'My Schedules'}</div>
            <div className="section__sub">{isAdmin ? 'Create and manage schedules' : 'Tap in/out and update class status'}</div>
          </div>
        </div>

        <div className="schedule">
          {isAdmin && (
            <div className="scheduleItem" style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr 1fr' }}>
              <div>
                <div className="cellTitle">Professor</div>
                <select
                  className="select"
                  value={form.professorUid}
                  onChange={(e) => {
                    const selectedUid = e.target.value;
                    const selectedProf = professors.find((p) => p.uid === selectedUid);
                    onFormChange({
                      ...form,
                      professorUid: selectedUid,
                      professorName: selectedProf?.displayName || selectedProf?.fullName || '',
                      employeeId: selectedProf?.employeeId || '',
                    });
                  }}
                >
                  <option value="">Select professor</option>
                  {professors.map((prof) => (
                    <option key={prof.uid} value={prof.uid}>
                      {prof.displayName || prof.fullName || prof.uid}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <div className="cellTitle">Employee ID</div>
                <input
                  className="input"
                  value={form.employeeId}
                  disabled
                  placeholder="Auto-filled"
                />
              </div>
              <div>
                <div className="cellTitle">Building</div>
                <select
                  className="select"
                  value={form.building}
                  onChange={(e) =>
                    onFormChange({
                      ...form,
                      building: e.target.value,
                      classroom: '',
                    })
                  }
                >
                  <option value="">Select building</option>
                  {buildings?.map((bld) => (
                    <option key={bld.id} value={bld.name || bld.building || bld.id}>
                      {bld.name || bld.building || bld.id}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <div className="cellTitle">Classroom</div>
                <select
                  className="select"
                  value={form.classroom}
                  onChange={(e) => onFormChange({ ...form, classroom: e.target.value })}
                  disabled={!form.building}
                >
                  <option value="">{form.building ? 'Select classroom' : 'Select building first'}</option>
                  {classrooms
                    ?.filter((cls) => {
                      const clsBuilding = cls.buildingName || cls.building || '';
                      return clsBuilding === form.building;
                    })
                    .map((cls) => (
                      <option key={cls.id} value={cls.roomNumber || cls.name || cls.classroom || cls.id}>
                        {cls.roomNumber || cls.name || cls.classroom || cls.id}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <div className="cellTitle">Subject</div>
                <input
                  className="input"
                  value={form.subject}
                  onChange={(e) => onFormChange({ ...form, subject: e.target.value })}
                  placeholder="Subject"
                />
              </div>
              <div>
                <div className="cellTitle">Day</div>
                <select
                  className="select"
                  value={form.day}
                  onChange={(e) => onFormChange({ ...form, day: e.target.value })}
                >
                  <option value="">Select day</option>
                  <option value="Monday">Monday</option>
                  <option value="Tuesday">Tuesday</option>
                  <option value="Wednesday">Wednesday</option>
                  <option value="Thursday">Thursday</option>
                  <option value="Friday">Friday</option>
                  <option value="Saturday">Saturday</option>
                  <option value="Sunday">Sunday</option>
                </select>
              </div>
              <div>
                <div className="cellTitle">Start Time</div>
                <input
                  className="input"
                  type="time"
                  value={form.timeStart}
                  onChange={(e) => onFormChange({ ...form, timeStart: e.target.value })}
                />
              </div>
              <div>
                <div className="cellTitle">End Time</div>
                <input
                  className="input"
                  type="time"
                  value={form.timeEnd}
                  onChange={(e) => onFormChange({ ...form, timeEnd: e.target.value })}
                />
              </div>
              <div className="rowActions">
                <button className="btn btn--dark btn--sm" type="button" onClick={onCreate} disabled={createBusy}>
                  {createBusy ? 'Saving…' : 'Create'}
                </button>
              </div>
            </div>
          )}

          {schedules.map((row) => (
            <div className="scheduleItem" data-id={row.id} key={row.id}>
              <div>
                <div className="cellTitle">Classroom</div>
                <div className="cellValue">{row.fixed?.classroom || ''}</div>
              </div>
              <div>
                <div className="cellTitle">Subject</div>
                <div className="cellValue">{row.fixed?.subject || ''}</div>
              </div>
              <div>
                <div className="cellTitle">Time</div>
                <div className="cellValue">{formatDayTimeRange(row.fixed?.day, row.fixed?.timeStart, row.fixed?.timeEnd)}</div>
              </div>
              <div>
                <div className="cellTitle">Building</div>
                <div className="cellValue">{row.fixed?.building || ''}</div>
              </div>
              <div>
                <div className="cellTitle">Status</div>
                {isAdmin ? (
                  <div className="cellValue">{row.live?.status || 'Scheduled'}</div>
                ) : (
                  <select
                    className="select"
                    value={row.live?.status || 'Scheduled'}
                    onChange={(e) => onStatusChange(row.id, e.target.value)}
                  >
                    <option>Scheduled</option>
                    <option>In Progress</option>
                    <option>Completed</option>
                    <option>Cancelled</option>
                  </select>
                )}
              </div>
              <div className="rowActions">
                {isAdmin ? (
                  <button
                    className="actionBtn actionBtn--danger"
                    type="button"
                    aria-label="Delete"
                    onClick={() => onDelete(row.id)}
                  >
                    <DeleteIcon />
                  </button>
                ) : (
                  <>
                    <button
                      className="btn btn--light btn--sm"
                      type="button"
                      onClick={async () => {
                        try {
                          await onTapIn(row.id);
                          alert('Tap In recorded.');
                        } catch (e) {
                          alert(e?.message || 'Failed to Tap In.');
                        }
                      }}
                    >
                      Tap In
                    </button>
                    <button
                      className="btn btn--light btn--sm"
                      type="button"
                      onClick={async () => {
                        try {
                          await onTapOut(row.id);
                          alert('Tap Out recorded.');
                        } catch (e) {
                          alert(e?.message || 'Failed to Tap Out.');
                        }
                      }}
                    >
                      Tap Out
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
