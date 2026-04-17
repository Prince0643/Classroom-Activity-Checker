import { QrIcon, DownloadIcon } from '../shared/Icons.jsx';
import { makeQrUrl } from '../../utils/helpers.js';

export default function ProfileTab({ profile, uid, onViewQr, onDownloadQr }) {
  const profName = profile?.fullName || profile?.displayName || 'Professor';
  const profId = profile?.employeeId || '—';
  const profEmail = profile?.email || '—';
  const profDept = profile?.department || '—';
  const profPhone = profile?.phone || '—';
  const profOffice = profile?.office || '—';
  const profSpec = profile?.specialization || '—';

  const qrUrl = makeQrUrl({ ...profile, uid });

  return (
    <section className="pane">
      <div className="grid">
        <div className="col">
          <div className="section">
            <div className="section__head">
              <div>
                <div className="section__title">Personal Information</div>
              </div>
            </div>

            <div className="info">
              <div className="info__row">
                <div className="info__item">
                  <div className="info__label">Full Name</div>
                  <div className="info__value">{profName}</div>
                </div>
                <div className="info__item">
                  <div className="info__label">Employee ID</div>
                  <div className="info__value">{profId}</div>
                </div>
              </div>

              <div className="info__row">
                <div className="info__item">
                  <div className="info__label">Email</div>
                  <div className="info__value">{profEmail}</div>
                </div>
                <div className="info__item">
                  <div className="info__label">Department</div>
                  <div className="info__value">{profDept}</div>
                </div>
              </div>

              <div className="info__row">
                <div className="info__item">
                  <div className="info__label">Phone</div>
                  <div className="info__value">{profPhone}</div>
                </div>
                <div className="info__item">
                  <div className="info__label">Office</div>
                  <div className="info__value">{profOffice}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="section">
            <div className="section__head">
              <div>
                <div className="section__title">Academic Details</div>
              </div>
            </div>

            <div className="info">
              <div className="info__row">
                <div className="info__item">
                  <div className="info__label">Specialization</div>
                  <div className="info__value">{profSpec}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col">
          <div className="section">
            <div className="section__head">
              <div>
                <div className="section__title">My QR Code</div>
              </div>
            </div>

            <div className="qr">
              <div className="qr__frame">
                <img src={qrUrl} alt="QR Code" />
              </div>

              <div className="qr__actions">
                <button className="btn btn--dark" type="button" onClick={onViewQr}>
                  <span className="btn__icon" aria-hidden="true">
                    <QrIcon />
                  </span>
                  View Full Size
                </button>
                <button className="btn btn--dark" type="button" onClick={onDownloadQr}>
                  <span className="btn__icon" aria-hidden="true">
                    <DownloadIcon />
                  </span>
                  Download QR Code
                </button>
              </div>

              <div className="hint">
                Scan this QR code to time in/out. You can scan in-app (Time Logs tab) or use your phone camera to open CACHE and record your log.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
