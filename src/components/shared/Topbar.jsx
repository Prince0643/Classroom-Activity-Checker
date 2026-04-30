import { UserIcon, LogoutIcon, ReportIcon } from './Icons.jsx';

export default function Topbar({ authUser, profile, metaUser, onLogin, onLogout, onReportClick, onGoToPublic }) {
  return (
    <header className="topbar">
      <div className="topbar__left">
        <button className="brand" type="button" onClick={onGoToPublic}>
          <div className="brand__mark" aria-hidden="true">
            <img src="/logo.jpg" alt="" />
          </div>
          <div className="brand__text">
            <div className="brand__title">CACHE</div>
            <div className="brand__subtitle">Classroom Activity Checker</div>
          </div>
        </button>
      </div>

      <div className="topbar__right">
        <div className="topbar__meta">
          <div className="meta__org">La Consolacion University Philippines</div>
          <div className="meta__user">{metaUser}</div>
        </div>

        <div className="topbar__actions">
          <button className="iconbtn" type="button" title="Download" aria-label="Download">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 3v10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              <path d="M8 11l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M5 20h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
          <button className="iconbtn" type="button" title="Share" aria-label="Share">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 8a3 3 0 1 0-2.83-4H12a3 3 0 0 0 0 6h.17A3 3 0 0 0 15 8Z" stroke="currentColor" strokeWidth="1.6" />
              <path d="M9 13l6-3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              <path d="M9 11l6 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              <path d="M6 15a3 3 0 1 0 2.83 4H9a3 3 0 0 0 0-6h-.17A3 3 0 0 0 6 15Z" stroke="currentColor" strokeWidth="1.6" />
              <path d="M18 15a3 3 0 1 0 2.83 4H21a3 3 0 0 0 0-6h-.17A3 3 0 0 0 18 15Z" stroke="currentColor" strokeWidth="1.6" />
            </svg>
          </button>
          <button className="iconbtn" type="button" title="Report Professor" aria-label="Report Professor" onClick={onReportClick}>
            <ReportIcon />
          </button>

          <button className={`pill ${authUser ? 'hidden' : ''}`} type="button" onClick={onLogin}>
            <span className="pill__icon" aria-hidden="true">
              <UserIcon />
            </span>
            Login
          </button>

          <button className={`pill pill--ghost ${authUser ? '' : 'hidden'}`} type="button" onClick={onLogout}>
            <span className="pill__icon" aria-hidden="true">
              <LogoutIcon />
            </span>
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
