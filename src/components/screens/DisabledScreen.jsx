export default function DisabledScreen({ onGoToPublic, onLogout }) {
  return (
    <section className="screen">
      <div className="center">
        <div className="auth">
          <div className="auth__title">Account Disabled</div>
          <div className="auth__subtitle">
            Your account has been disabled by an administrator. Please contact the administration for assistance.
          </div>
          <div className="actions" style={{ marginTop: 16 }}>
            <button className="btn btn--light" type="button" onClick={onGoToPublic}>
              Back to Public Board
            </button>
            <button className="btn btn--dark" type="button" onClick={onLogout}>
              Logout
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

