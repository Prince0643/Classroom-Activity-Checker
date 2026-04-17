export default function ProfessorRequestsTab({
  schedules,
  form,
  onFormChange,
  onSubmit,
  submitBusy,
  buildings,
  classrooms,
}) {
  return (
    <section className="pane">
      <div className="section">
        <div className="section__head">
          <div>
            <div className="section__title">Change Requests</div>
            <div className="section__sub">Submit a request to change room/subject/time (admin must approve)</div>
          </div>
        </div>
        <div className="schedule">
          <div className="scheduleItem" style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr' }}>
            <div>
              <div className="cellTitle">Schedule</div>
              <select
                className="select"
                value={form.scheduleId}
                onChange={(e) => {
                  const id = e.target.value;
                  const s = schedules.find((x) => x.id === id);
                  onFormChange({
                    ...form,
                    scheduleId: id,
                    classroom: '',
                    subject: '',
                    building: '',
                    day: s?.fixed?.day || '',
                    timeStart: s?.fixed?.timeStart || '',
                    timeEnd: s?.fixed?.timeEnd || '',
                  });
                }}
              >
                <option value="">Select schedule</option>
                {schedules.map((s) => (
                  <option value={s.id} key={s.id}>
                    {s.fixed?.subject || 'Subject'} — {s.fixed?.classroom || 'Room'}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <div className="cellTitle">New Building (optional)</div>
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
              <div className="cellTitle">New Classroom (optional)</div>
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
              <div className="cellTitle">New Subject (optional)</div>
              <input
                className="input"
                value={form.subject}
                onChange={(e) => onFormChange({ ...form, subject: e.target.value })}
                placeholder="e.g. Data Structures"
              />
            </div>
            <div>
              <div className="cellTitle">New Day</div>
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
              <div className="cellTitle">New Start Time</div>
              <input
                className="input"
                type="time"
                value={form.timeStart}
                onChange={(e) => onFormChange({ ...form, timeStart: e.target.value })}
              />
            </div>
            <div>
              <div className="cellTitle">New End Time</div>
              <input
                className="input"
                type="time"
                value={form.timeEnd}
                onChange={(e) => onFormChange({ ...form, timeEnd: e.target.value })}
              />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <div className="cellTitle">Reason</div>
              <input
                className="input"
                value={form.reason}
                onChange={(e) => onFormChange({ ...form, reason: e.target.value })}
                placeholder="Why do you need this change?"
              />
            </div>
            <div className="rowActions" style={{ gridColumn: '1 / -1' }}>
              <button
                className="btn btn--dark btn--sm"
                type="button"
                disabled={!form.scheduleId || submitBusy}
                onClick={onSubmit}
              >
                {submitBusy ? 'Submitting…' : 'Submit Request'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
