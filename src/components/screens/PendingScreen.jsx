export default function PendingScreen({ onGoToPublic, onLogout }) {
  return (
    <section className="screen">
      <div className="center">
        <div className="auth">
          <div className="auth__title">Pending Approval</div>
          <div className="auth__subtitle">
            Your professor account is awaiting admin approval. Please try again later.
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
