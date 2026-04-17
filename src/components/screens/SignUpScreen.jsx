import { HomeIcon } from '../shared/Icons.jsx';

export default function SignUpScreen({
  form,
  onChange,
  onSubmit,
  onGoToLogin,
  signUpBusy,
  signUpError,
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
          <div className="auth__title">Professor Sign Up</div>
          <div className="auth__subtitle">Create your professor account</div>

          <form
            className="form"
            onSubmit={(e) => {
              e.preventDefault();
              onSubmit();
            }}
          >
            <label className="field">
              <span className="field__label">Email *</span>
              <input
                className="input"
                type="email"
                autoComplete="email"
                placeholder="professor@lcu.edu.ph"
                required
                value={form.email}
                onChange={(e) => onChange({ ...form, email: e.target.value })}
              />
            </label>
            <label className="field">
              <span className="field__label">Password *</span>
              <input
                className="input"
                type="password"
                autoComplete="new-password"
                placeholder="Min 6 characters"
                required
                minLength={6}
                value={form.password}
                onChange={(e) => onChange({ ...form, password: e.target.value })}
              />
            </label>
            <label className="field">
              <span className="field__label">Confirm Password *</span>
              <input
                className="input"
                type="password"
                autoComplete="new-password"
                placeholder="Re-enter password"
                required
                value={form.confirmPassword}
                onChange={(e) => onChange({ ...form, confirmPassword: e.target.value })}
              />
            </label>
            <label className="field">
              <span className="field__label">Full Name *</span>
              <input
                className="input"
                placeholder="Dr. Maria Santos"
                required
                value={form.fullName}
                onChange={(e) => onChange({ ...form, fullName: e.target.value })}
              />
            </label>
            <label className="field">
              <span className="field__label">Display Name</span>
              <input
                className="input"
                placeholder="Maria"
                value={form.displayName}
                onChange={(e) => onChange({ ...form, displayName: e.target.value })}
              />
            </label>
            <label className="field">
              <span className="field__label">Employee ID</span>
              <input
                className="input"
                placeholder="EMP-2026-001"
                value={form.employeeId}
                onChange={(e) => onChange({ ...form, employeeId: e.target.value })}
              />
            </label>
            <label className="field">
              <span className="field__label">Department</span>
              <input
                className="input"
                placeholder="Computer Science"
                value={form.department}
                onChange={(e) => onChange({ ...form, department: e.target.value })}
              />
            </label>
            <label className="field">
              <span className="field__label">Phone</span>
              <input
                className="input"
                type="tel"
                placeholder="+63 912 345 6789"
                value={form.phone}
                onChange={(e) => onChange({ ...form, phone: e.target.value })}
              />
            </label>
            <label className="field">
              <span className="field__label">Office</span>
              <input
                className="input"
                placeholder="Room 201, IT Building"
                value={form.office}
                onChange={(e) => onChange({ ...form, office: e.target.value })}
              />
            </label>
            <label className="field">
              <span className="field__label">Specialization</span>
              <input
                className="input"
                placeholder="Artificial Intelligence, Machine Learning"
                value={form.specialization}
                onChange={(e) => onChange({ ...form, specialization: e.target.value })}
              />
            </label>

            <div className="actions">
              <button className="btn btn--light" type="button" onClick={onGoToLogin}>
                Back to Login
              </button>
              <button className="btn btn--dark" type="submit" disabled={signUpBusy}>
                {signUpBusy ? 'Creating account…' : 'Sign Up'}
              </button>
            </div>

            {signUpError ? (
              <div className="demo" role="alert">
                <div className="demo__title">Sign Up Error</div>
                <div className="demo__row">{signUpError}</div>
              </div>
            ) : null}
          </form>
        </div>
      </div>
    </section>
  );
}
