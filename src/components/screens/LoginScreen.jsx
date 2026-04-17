import { HomeIcon } from '../shared/Icons.jsx';

export default function LoginScreen({
  onLoginSubmit,
  onGoToPublic,
  onGoToSignUp,
  loginBusy,
  authError,
}) {
  return (
    <section className="screen">
      <div className="center">
        <div className="auth">
          <div className="auth__badge" aria-hidden="true">
            <div className="badge">
              <HomeIcon />
            </div>
          </div>
          <div className="auth__title">Login</div>
          <div className="auth__subtitle">Use your account email and password</div>

          <form className="form" onSubmit={onLoginSubmit}>
            <label className="field">
              <span className="field__label">Email</span>
              <input
                className="input"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="Enter your email"
                required
              />
            </label>
            <label className="field">
              <span className="field__label">Password</span>
              <input
                className="input"
                type="password"
                name="password"
                autoComplete="current-password"
                placeholder="Enter your password"
                required
              />
            </label>

            <div className="actions">
              <button className="btn btn--light" type="button" onClick={onGoToPublic}>
                Cancel
              </button>
              <button className="btn btn--dark" type="submit" disabled={loginBusy}>
                {loginBusy ? 'Logging in…' : 'Login'}
              </button>
            </div>

            <div style={{ marginTop: 16, textAlign: 'center', fontSize: 14 }}>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={onGoToSignUp}
                style={{ background: 'none', border: 'none', color: '#1e40af', cursor: 'pointer', textDecoration: 'underline' }}
              >
                Sign up as Professor
              </button>
            </div>

            {authError ? (
              <div className="demo" role="alert">
                <div className="demo__title">Login Error</div>
                <div className="demo__row">{authError}</div>
              </div>
            ) : null}
          </form>
        </div>
      </div>
    </section>
  );
}
