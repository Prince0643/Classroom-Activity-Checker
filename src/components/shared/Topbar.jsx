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
          <button className="iconbtn iconbtn--black" type="button" title="Report Professor" aria-label="Report Professor" onClick={onReportClick}>
            <ReportIcon />
          </button>

          <button className={`pill pill--login ${authUser ? 'hidden' : ''}`} type="button" onClick={onLogin}>
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
