import { ClockIcon } from '../shared/Icons.jsx';
import { formatDayTimeRange } from '../../utils/helpers.js';
import StatusTag from '../shared/StatusTag.jsx';

export default function PublicScreen({ clock, today, schedules }) {
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
        </div>
      </div>

      <div className="card">
        <div className="table table--wide">
          <div className="table__head">
            <div>Classroom</div>
            <div>Subject</div>
            <div>Professor</div>
            <div>Time</div>
            <div>Building</div>
            <div>Status</div>
          </div>
          <div className="table__body">
            {schedules.map((s, idx) => (
              <div className="table__row" key={`${s.id}-${idx}`}>
                <div>
                  <div className="cellValue">{s.fixed?.classroom || ''}</div>
                </div>
                <div>
                  <div className="cellValue">{s.fixed?.subject || ''}</div>
                </div>
                <div>
                  <div className="cellValue">{s.fixed?.professorName || ''}</div>
                </div>
                <div>
                  <div className="cellValue">{formatDayTimeRange(s.fixed?.day, s.fixed?.timeStart, s.fixed?.timeEnd)}</div>
                </div>
                <div>
                  <div className="cellValue">{s.fixed?.building || ''}</div>
                </div>
                <div>
                  <StatusTag status={s.live?.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
