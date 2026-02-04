import React, { useEffect, useMemo, useState } from 'react';
import {
  approveProfessor,
  applyChangeRequestToScheduleAsAdmin,
  createSchedule,
  deleteScheduleAsAdmin,
  getIsAdmin,
  getOrCreateProfessorProfile,
  getUserProfile,
  loginWithEmail,
  logout,
  reviewChangeRequestAsAdmin,
  setScheduleStatusAsProfessor,
  submitChangeRequest,
  tapInAsProfessor,
  tapOutAsProfessor,
  watchAuth,
  watchChangeRequests,
  watchPendingProfessors,
  watchSchedulesPublic,
  watchSchedulesForProfessor,
} from './cacheApi.js';

const statusToTagClass = (status) => {
  const s = String(status || '').toLowerCase();
  if (s === 'scheduled') return 'tag--scheduled';
  if (s === 'in progress' || s === 'in_progress') return 'tag--progress';
  if (s === 'completed') return 'tag--completed';
  if (s === 'cancelled' || s === 'canceled') return 'tag--cancelled';
  if (s === 'on time' || s === 'ontime') return 'tag--ontime';
  if (s === 'delayed') return 'tag--delayed';
  if (s === 'room change' || s === 'room_change') return 'tag--room';
  return 'tag--scheduled';
};

const pad2 = (n) => String(n).padStart(2, '0');

const formatTimeRange = (timeStart, timeEnd) => {
  if (!timeStart || !timeEnd) return '';
  const s = new Date(timeStart);
  const e = new Date(timeEnd);
  const opts = { hour: '2-digit', minute: '2-digit' };
  return `${s.toLocaleTimeString(undefined, opts)} - ${e.toLocaleTimeString(undefined, opts)}`;
};

const toDatetimeLocalValue = (ms) => {
  if (!ms) return '';
  const d = new Date(ms);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const fromDatetimeLocalValue = (value) => {
  const ms = Date.parse(value);
  return Number.isFinite(ms) ? ms : 0;
};

const makeQrUrl = (user) => {
  const payload = {
    name: user?.fullName || 'Maria Santos',
    id: user?.employeeId || 'EMP-2018-001',
    dept: user?.department || 'Computer Science',
    email: user?.email || 'maria.santos@lcu.edu.ph',
  };
  const data = encodeURIComponent(JSON.stringify(payload));
  return `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${data}`;
};

export default function App() {
  const [screen, setScreen] = useState('public');
  const [activeTab, setActiveTab] = useState('schedules');
  const [authUser, setAuthUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [schedules, setSchedules] = useState([]);
  const [pendingProfessors, setPendingProfessors] = useState([]);
  const [changeRequests, setChangeRequests] = useState([]);
  const [clock, setClock] = useState('--:--:--');
  const [today, setToday] = useState('---');
  const [qrOpen, setQrOpen] = useState(false);
  const [loginBusy, setLoginBusy] = useState(false);
  const [adminCreateBusy, setAdminCreateBusy] = useState(false);
  const [profReqBusy, setProfReqBusy] = useState(false);
  const [authError, setAuthError] = useState('');

  const [adminScheduleForm, setAdminScheduleForm] = useState({
    professorUid: '',
    professorName: '',
    classroom: '',
    subject: '',
    building: '',
    timeStart: '',
    timeEnd: '',
  });

  const [profRequestForm, setProfRequestForm] = useState({
    scheduleId: '',
    classroom: '',
    subject: '',
    building: '',
    timeStart: '',
    timeEnd: '',
    reason: '',
  });

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setQrOpen(false);
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    const unsub = watchAuth(async (u) => {
      setAuthLoading(true);
      setAuthUser(u);
      setAuthError('');

      if (!u) {
        setIsAdmin(false);
        setProfile(null);
        setAuthLoading(false);
        setScreen('public');
        return;
      }

      const admin = await getIsAdmin(u.uid);
      setIsAdmin(admin);

      if (admin) {
        const p = (await getUserProfile(u.uid)) || {
          role: 'admin',
          approved: true,
          email: u.email || '',
          displayName: u.displayName || 'Admin',
        };
        setProfile({ ...p, role: 'admin', approved: true });
        setScreen('dashboard');
        setActiveTab('schedules');
        setAuthLoading(false);
        return;
      }

      const p = await getOrCreateProfessorProfile(u);
      setProfile(p);
      if (p?.approved) {
        setScreen('dashboard');
        setActiveTab('schedules');
      } else {
        setScreen('pending');
      }
      setAuthLoading(false);
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    let unsub = null;
    if (isAdmin) {
      unsub = watchSchedulesPublic(setSchedules);
    } else if (authUser && profile?.approved) {
      unsub = watchSchedulesForProfessor(authUser.uid, setSchedules);
    } else {
      unsub = watchSchedulesPublic(setSchedules);
    }
    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, [authUser, isAdmin, profile?.approved]);

  useEffect(() => {
    if (!isAdmin) return undefined;
    const unsubA = watchPendingProfessors(setPendingProfessors);
    const unsubR = watchChangeRequests(setChangeRequests);
    return () => {
      if (typeof unsubA === 'function') unsubA();
      if (typeof unsubR === 'function') unsubR();
    };
  }, [isAdmin]);

  useEffect(() => {
    const tick = () => {
      const d = new Date();
      setClock(`${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`);
      setToday(
        d.toLocaleDateString(undefined, {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
      );
    };

    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  const qrUrl = useMemo(() => makeQrUrl(profile), [profile]);

  const metaUser = authUser ? `Logged in as ${profile?.displayName || authUser.email || authUser.uid}` : 'Not logged in';
  const welcomeTitle = authUser ? `Welcome, ${profile?.displayName || authUser.email || 'User'}` : 'Welcome';
  const welcomeDept = profile?.department ? `${profile.department} Department` : isAdmin ? 'Administration' : 'Department';

  const profName = profile?.fullName || profile?.displayName || 'Professor';
  const profId = profile?.employeeId || '—';
  const profEmail = profile?.email || authUser?.email || '—';
  const profDept = profile?.department || '—';
  const profPhone = profile?.phone || '—';
  const profOffice = profile?.office || '—';
  const profSpec = profile?.specialization || '—';

  const onLogout = async () => {
    await logout();
  };

  const onLoginSubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get('email') || '').trim();
    const password = String(fd.get('password') || '').trim();

    setAuthError('');
    setLoginBusy(true);
    try {
      await loginWithEmail(email, password);
    } catch (err) {
      setAuthError(err?.message || 'Login failed');
    } finally {
      setLoginBusy(false);
    }
  };

  const adminCreateSchedule = async () => {
    setAdminCreateBusy(true);
    try {
      await createSchedule({
        professorUid: adminScheduleForm.professorUid.trim(),
        professorName: adminScheduleForm.professorName.trim(),
        classroom: adminScheduleForm.classroom.trim(),
        subject: adminScheduleForm.subject.trim(),
        building: adminScheduleForm.building.trim(),
        timeStart: fromDatetimeLocalValue(adminScheduleForm.timeStart),
        timeEnd: fromDatetimeLocalValue(adminScheduleForm.timeEnd),
        status: 'Scheduled',
      });
      setAdminScheduleForm({
        professorUid: '',
        professorName: '',
        classroom: '',
        subject: '',
        building: '',
        timeStart: '',
        timeEnd: '',
      });
    } finally {
      setAdminCreateBusy(false);
    }
  };

  const professorSubmitRequest = async () => {
    if (!authUser) return;
    setProfReqBusy(true);
    try {
      const changes = {};
      if (profRequestForm.classroom.trim()) changes.classroom = profRequestForm.classroom.trim();
      if (profRequestForm.subject.trim()) changes.subject = profRequestForm.subject.trim();
      if (profRequestForm.building.trim()) changes.building = profRequestForm.building.trim();
      if (profRequestForm.timeStart) changes.timeStart = fromDatetimeLocalValue(profRequestForm.timeStart);
      if (profRequestForm.timeEnd) changes.timeEnd = fromDatetimeLocalValue(profRequestForm.timeEnd);

      await submitChangeRequest(authUser.uid, profRequestForm.scheduleId, changes, profRequestForm.reason);
      setProfRequestForm({
        scheduleId: '',
        classroom: '',
        subject: '',
        building: '',
        timeStart: '',
        timeEnd: '',
        reason: '',
      });
      alert('Request submitted for admin review.');
    } finally {
      setProfReqBusy(false);
    }
  };

  const downloadQr = () => {
    if (!qrUrl) return;
    const a = document.createElement('a');
    a.href = qrUrl;
    a.download = 'my-qr-code.png';
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <>
      <header className="topbar">
        <div className="topbar__left">
          <div className="brand">
            <div className="brand__mark" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M4 10.5L12 5l8 5.5v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-9Z"
                  stroke="currentColor"
                  strokeWidth="1.6"
                />
                <path
                  d="M9 21v-7a3 3 0 0 1 6 0v7"
                  stroke="currentColor"
                  strokeWidth="1.6"
                />
              </svg>
            </div>
            <div className="brand__text">
              <div className="brand__title">CACHE</div>
              <div className="brand__subtitle">Classroom Activity Checker</div>
            </div>
          </div>
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
                <path
                  d="M8 11l4 4 4-4"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path d="M5 20h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>
            <button className="iconbtn" type="button" title="Share" aria-label="Share">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M15 8a3 3 0 1 0-2.83-4H12a3 3 0 0 0 0 6h.17A3 3 0 0 0 15 8Z"
                  stroke="currentColor"
                  strokeWidth="1.6"
                />
                <path d="M9 13l6-3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                <path d="M9 11l6 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                <path
                  d="M6 15a3 3 0 1 0 2.83 4H9a3 3 0 0 0 0-6h-.17A3 3 0 0 0 6 15Z"
                  stroke="currentColor"
                  strokeWidth="1.6"
                />
                <path
                  d="M18 15a3 3 0 1 0 2.83 4H21a3 3 0 0 0 0-6h-.17A3 3 0 0 0 18 15Z"
                  stroke="currentColor"
                  strokeWidth="1.6"
                />
              </svg>
            </button>
            <button className="iconbtn" type="button" title="Apps" aria-label="Apps">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M5 5h4v4H5V5Zm5 0h4v4h-4V5Zm5 0h4v4h-4V5ZM5 10h4v4H5v-4Zm5 0h4v4h-4v-4Zm5 0h4v4h-4v-4ZM5 15h4v4H5v-4Zm5 0h4v4h-4v-4Zm5 0h4v4h-4v-4Z"
                  fill="currentColor"
                />
              </svg>
            </button>

            <button className={`pill ${authUser ? 'hidden' : ''}`} type="button" onClick={() => setScreen('login')}>
              <span className="pill__icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z"
                    stroke="currentColor"
                    strokeWidth="1.6"
                  />
                  <path
                    d="M4 21a8 8 0 0 1 16 0"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              Login
            </button>

            <button className={`pill pill--ghost ${authUser ? '' : 'hidden'}`} type="button" onClick={onLogout}>
              <span className="pill__icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M10 17l5-5-5-5"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path d="M15 12H3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                  <path
                    d="M21 21V3a2 2 0 0 0-2-2h-6"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="shell">
        <section className={`screen ${screen === 'public' ? '' : 'hidden'}`}>
          <div className="panel panel--blue">
            <div className="panel__left">
              <div className="timebox">
                <div className="timebox__icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M12 21a9 9 0 1 0-9-9 9 9 0 0 0 9 9Z"
                      stroke="currentColor"
                      strokeWidth="1.6"
                    />
                    <path
                      d="M12 7v5l3 2"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
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
                      <div className="cellValue">{formatTimeRange(s.fixed?.timeStart, s.fixed?.timeEnd)}</div>
                    </div>
                    <div>
                      <div className="cellValue">{s.fixed?.building || ''}</div>
                    </div>
                    <div>
                      <span className={`tag ${statusToTagClass(s.live?.status)}`}>{s.live?.status || 'Scheduled'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className={`screen ${screen === 'pending' ? '' : 'hidden'}`}>
          <div className="center">
            <div className="auth">
              <div className="auth__title">Pending Approval</div>
              <div className="auth__subtitle">
                Your professor account is awaiting admin approval. Please try again later.
              </div>
              <div className="actions" style={{ marginTop: 16 }}>
                <button className="btn btn--light" type="button" onClick={() => setScreen('public')}>
                  Back to Public Board
                </button>
                <button className="btn btn--dark" type="button" onClick={onLogout}>
                  Logout
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className={`screen ${screen === 'login' ? '' : 'hidden'}`}>
          <div className="center">
            <div className="auth">
              <div className="auth__badge" aria-hidden="true">
                <div className="badge">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M4 10.5L12 5l8 5.5v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-9Z"
                      stroke="currentColor"
                      strokeWidth="1.6"
                    />
                    <path
                      d="M9 21v-7a3 3 0 0 1 6 0v7"
                      stroke="currentColor"
                      strokeWidth="1.6"
                    />
                  </svg>
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
                  <button className="btn btn--light" type="button" onClick={() => setScreen('public')}>
                    Cancel
                  </button>
                  <button className="btn btn--dark" type="submit" disabled={loginBusy}>
                    {loginBusy ? 'Logging in…' : 'Login'}
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

        <section className={`screen ${screen === 'dashboard' ? '' : 'hidden'}`}>
          <div className="welcome">
            <div className="welcome__icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z"
                  stroke="currentColor"
                  strokeWidth="1.6"
                />
                <path
                  d="M4 21a8 8 0 0 1 16 0"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <div>
              <div className="welcome__title">{welcomeTitle}</div>
              <div className="welcome__sub">{welcomeDept}</div>
            </div>
          </div>

          <div className="tabs">
            <button className={`tab ${activeTab === 'schedules' ? 'is-active' : ''}`} type="button" onClick={() => setActiveTab('schedules')}>
              <span className="tab__icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M7 4v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                  <path d="M17 4v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                  <path d="M4 9h16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                  <path
                    d="M6 6h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z"
                    stroke="currentColor"
                    strokeWidth="1.6"
                  />
                </svg>
              </span>
              Schedule Manager
            </button>

            {isAdmin ? (
              <>
                <button
                  className={`tab ${activeTab === 'approvals' ? 'is-active' : ''}`}
                  type="button"
                  onClick={() => setActiveTab('approvals')}
                >
                  <span className="tab__icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M12 2l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1 3-6Z"
                        stroke="currentColor"
                        strokeWidth="1.6"
                      />
                    </svg>
                  </span>
                  Approvals
                </button>

                <button
                  className={`tab ${activeTab === 'adminRequests' ? 'is-active' : ''}`}
                  type="button"
                  onClick={() => setActiveTab('adminRequests')}
                >
                  <span className="tab__icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M7 7h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                      <path d="M7 12h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                      <path d="M7 17h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                      <path
                        d="M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"
                        stroke="currentColor"
                        strokeWidth="1.6"
                      />
                    </svg>
                  </span>
                  Requests
                </button>
              </>
            ) : (
              <button className={`tab ${activeTab === 'requests' ? 'is-active' : ''}`} type="button" onClick={() => setActiveTab('requests')}>
                <span className="tab__icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M7 7h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                    <path d="M7 12h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                    <path d="M7 17h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                    <path d="M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="1.6" />
                  </svg>
                </span>
                Requests
              </button>
            )}

            <button className={`tab ${activeTab === 'profile' ? 'is-active' : ''}`} type="button" onClick={() => setActiveTab('profile')}>
              <span className="tab__icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z"
                    stroke="currentColor"
                    strokeWidth="1.6"
                  />
                  <path
                    d="M4 21a8 8 0 0 1 16 0"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              My Profile
            </button>
          </div>

          <div className="tabpanes">
            <section className={`pane ${activeTab === 'schedules' ? '' : 'hidden'}`}>
              <div className="section">
                <div className="section__head">
                  <div>
                    <div className="section__title">{isAdmin ? 'Schedules' : 'My Schedules'}</div>
                    <div className="section__sub">{isAdmin ? 'Create and manage schedules' : 'Tap in/out and update class status'}</div>
                  </div>
                  {isAdmin ? null : null}
                </div>

                <div className="schedule">
                  {isAdmin ? (
                    <div className="scheduleItem" style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr 1fr' }}>
                      <div>
                        <div className="cellTitle">Professor UID</div>
                        <input
                          className="input"
                          value={adminScheduleForm.professorUid}
                          onChange={(e) => setAdminScheduleForm((p) => ({ ...p, professorUid: e.target.value }))}
                          placeholder="uid"
                        />
                      </div>
                      <div>
                        <div className="cellTitle">Professor Name</div>
                        <input
                          className="input"
                          value={adminScheduleForm.professorName}
                          onChange={(e) => setAdminScheduleForm((p) => ({ ...p, professorName: e.target.value }))}
                          placeholder="Prof. Name"
                        />
                      </div>
                      <div>
                        <div className="cellTitle">Classroom</div>
                        <input
                          className="input"
                          value={adminScheduleForm.classroom}
                          onChange={(e) => setAdminScheduleForm((p) => ({ ...p, classroom: e.target.value }))}
                          placeholder="Room 101"
                        />
                      </div>
                      <div>
                        <div className="cellTitle">Subject</div>
                        <input
                          className="input"
                          value={adminScheduleForm.subject}
                          onChange={(e) => setAdminScheduleForm((p) => ({ ...p, subject: e.target.value }))}
                          placeholder="Subject"
                        />
                      </div>
                      <div>
                        <div className="cellTitle">Start</div>
                        <input
                          className="input"
                          type="datetime-local"
                          value={adminScheduleForm.timeStart}
                          onChange={(e) => setAdminScheduleForm((p) => ({ ...p, timeStart: e.target.value }))}
                        />
                      </div>
                      <div>
                        <div className="cellTitle">End</div>
                        <input
                          className="input"
                          type="datetime-local"
                          value={adminScheduleForm.timeEnd}
                          onChange={(e) => setAdminScheduleForm((p) => ({ ...p, timeEnd: e.target.value }))}
                        />
                      </div>
                      <div>
                        <div className="cellTitle">Building</div>
                        <input
                          className="input"
                          value={adminScheduleForm.building}
                          onChange={(e) => setAdminScheduleForm((p) => ({ ...p, building: e.target.value }))}
                          placeholder="Building"
                        />
                      </div>
                      <div className="rowActions">
                        <button className="btn btn--dark btn--sm" type="button" onClick={adminCreateSchedule} disabled={adminCreateBusy}>
                          {adminCreateBusy ? 'Saving…' : 'Create'}
                        </button>
                      </div>
                    </div>
                  ) : null}

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
                        <div className="cellValue">{formatTimeRange(row.fixed?.timeStart, row.fixed?.timeEnd)}</div>
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
                            onChange={(e) => setScheduleStatusAsProfessor(row.id, e.target.value)}
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
                            onClick={() => deleteScheduleAsAdmin(row.id)}
                          >
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M4 7h16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                              <path d="M10 11v6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                              <path d="M14 11v6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                              <path d="M6 7l1 14h10l1-14" stroke="currentColor" strokeWidth="1.6" />
                              <path d="M9 7V4h6v3" stroke="currentColor" strokeWidth="1.6" />
                            </svg>
                          </button>
                        ) : (
                          <>
                            <button className="btn btn--light btn--sm" type="button" onClick={() => tapInAsProfessor(row.id)}>
                              Tap In
                            </button>
                            <button className="btn btn--light btn--sm" type="button" onClick={() => tapOutAsProfessor(row.id)}>
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

            <section className={`pane ${activeTab === 'approvals' ? '' : 'hidden'}`}>
              <div className="section">
                <div className="section__head">
                  <div>
                    <div className="section__title">Professor Approvals</div>
                    <div className="section__sub">Approve professor accounts to access tap in/out and status updates</div>
                  </div>
                </div>
                <div className="schedule">
                  {pendingProfessors.length === 0 ? (
                    <div className="cellValue">No pending professor accounts.</div>
                  ) : (
                    pendingProfessors.map((p) => (
                      <div className="scheduleItem" key={p.uid} style={{ gridTemplateColumns: '1.6fr 1.6fr 1fr 120px' }}>
                        <div>
                          <div className="cellTitle">UID</div>
                          <div className="cellValue">{p.uid}</div>
                        </div>
                        <div>
                          <div className="cellTitle">Email</div>
                          <div className="cellValue">{p.email || '—'}</div>
                        </div>
                        <div>
                          <div className="cellTitle">Display Name</div>
                          <div className="cellValue">{p.displayName || '—'}</div>
                        </div>
                        <div className="rowActions">
                          <button className="btn btn--dark btn--sm" type="button" onClick={() => approveProfessor(p.uid, true)}>
                            Approve
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </section>

            <section className={`pane ${activeTab === 'adminRequests' ? '' : 'hidden'}`}>
              <div className="section">
                <div className="section__head">
                  <div>
                    <div className="section__title">Change Requests</div>
                    <div className="section__sub">Review professor requests for schedule changes</div>
                  </div>
                </div>

                <div className="schedule">
                  {changeRequests.filter((r) => r.status === 'pending').length === 0 ? (
                    <div className="cellValue">No pending requests.</div>
                  ) : (
                    changeRequests
                      .filter((r) => r.status === 'pending')
                      .map((r) => (
                        <div
                          className="scheduleItem"
                          key={r.id}
                          style={{ gridTemplateColumns: '1.2fr 2fr 2fr 1fr 180px' }}
                        >
                          <div>
                            <div className="cellTitle">Schedule</div>
                            <div className="cellValue">{r.scheduleId}</div>
                          </div>
                          <div>
                            <div className="cellTitle">Professor UID</div>
                            <div className="cellValue">{r.professorUid}</div>
                          </div>
                          <div>
                            <div className="cellTitle">Requested Changes</div>
                            <div className="cellValue" style={{ fontWeight: 500 }}>
                              {JSON.stringify(r.changes || {})}
                            </div>
                          </div>
                          <div>
                            <div className="cellTitle">Reason</div>
                            <div className="cellValue" style={{ fontWeight: 500 }}>
                              {r.reason || '—'}
                            </div>
                          </div>
                          <div className="rowActions">
                            <button
                              className="btn btn--dark btn--sm"
                              type="button"
                              onClick={() => applyChangeRequestToScheduleAsAdmin(r, authUser?.uid)}
                            >
                              Approve + Apply
                            </button>
                            <button
                              className="btn btn--light btn--sm"
                              type="button"
                              onClick={() => reviewChangeRequestAsAdmin(r.id, 'rejected', authUser?.uid)}
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </div>
            </section>

            <section className={`pane ${activeTab === 'requests' ? '' : 'hidden'}`}>
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
                        value={profRequestForm.scheduleId}
                        onChange={(e) => {
                          const id = e.target.value;
                          const s = schedules.find((x) => x.id === id);
                          setProfRequestForm((p) => ({
                            ...p,
                            scheduleId: id,
                            classroom: '',
                            subject: '',
                            building: '',
                            timeStart: s?.fixed?.timeStart ? toDatetimeLocalValue(s.fixed.timeStart) : '',
                            timeEnd: s?.fixed?.timeEnd ? toDatetimeLocalValue(s.fixed.timeEnd) : '',
                          }));
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
                      <div className="cellTitle">New Classroom (optional)</div>
                      <input
                        className="input"
                        value={profRequestForm.classroom}
                        onChange={(e) => setProfRequestForm((p) => ({ ...p, classroom: e.target.value }))}
                        placeholder="e.g. Room 305"
                      />
                    </div>
                    <div>
                      <div className="cellTitle">New Subject (optional)</div>
                      <input
                        className="input"
                        value={profRequestForm.subject}
                        onChange={(e) => setProfRequestForm((p) => ({ ...p, subject: e.target.value }))}
                        placeholder="e.g. Data Structures"
                      />
                    </div>
                    <div>
                      <div className="cellTitle">New Building (optional)</div>
                      <input
                        className="input"
                        value={profRequestForm.building}
                        onChange={(e) => setProfRequestForm((p) => ({ ...p, building: e.target.value }))}
                        placeholder="e.g. IT Building"
                      />
                    </div>
                    <div>
                      <div className="cellTitle">New Start</div>
                      <input
                        className="input"
                        type="datetime-local"
                        value={profRequestForm.timeStart}
                        onChange={(e) => setProfRequestForm((p) => ({ ...p, timeStart: e.target.value }))}
                      />
                    </div>
                    <div>
                      <div className="cellTitle">New End</div>
                      <input
                        className="input"
                        type="datetime-local"
                        value={profRequestForm.timeEnd}
                        onChange={(e) => setProfRequestForm((p) => ({ ...p, timeEnd: e.target.value }))}
                      />
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <div className="cellTitle">Reason</div>
                      <input
                        className="input"
                        value={profRequestForm.reason}
                        onChange={(e) => setProfRequestForm((p) => ({ ...p, reason: e.target.value }))}
                        placeholder="Why do you need this change?"
                      />
                    </div>
                    <div className="rowActions" style={{ gridColumn: '1 / -1' }}>
                      <button
                        className="btn btn--dark btn--sm"
                        type="button"
                        disabled={!profRequestForm.scheduleId || profReqBusy}
                        onClick={professorSubmitRequest}
                      >
                        {profReqBusy ? 'Submitting…' : 'Submit Request'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className={`pane ${activeTab === 'adminRequests' && !isAdmin ? '' : 'hidden'}`} />

            <section className={`pane ${activeTab === 'profile' ? '' : 'hidden'}`}>
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
                        <button className="btn btn--dark" type="button" onClick={() => setQrOpen(true)}>
                          <span className="btn__icon" aria-hidden="true">
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path
                                d="M9 3H3v6"
                                stroke="currentColor"
                                strokeWidth="1.6"
                                strokeLinecap="round"
                              />
                              <path
                                d="M15 3h6v6"
                                stroke="currentColor"
                                strokeWidth="1.6"
                                strokeLinecap="round"
                              />
                              <path
                                d="M9 21H3v-6"
                                stroke="currentColor"
                                strokeWidth="1.6"
                                strokeLinecap="round"
                              />
                              <path
                                d="M21 21h-6v-6"
                                stroke="currentColor"
                                strokeWidth="1.6"
                                strokeLinecap="round"
                              />
                            </svg>
                          </span>
                          View Full Size
                        </button>
                        <button className="btn btn--dark" type="button" onClick={downloadQr}>
                          <span className="btn__icon" aria-hidden="true">
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M12 3v10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                              <path
                                d="M8 11l4 4 4-4"
                                stroke="currentColor"
                                strokeWidth="1.6"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              <path d="M5 20h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                            </svg>
                          </span>
                          Download QR Code
                        </button>
                      </div>

                      <div className="hint">
                        This QR Code contains your professional information and can be used for identification and
                        attendance tracking.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </section>

        <div
          className={`modal ${qrOpen ? '' : 'hidden'}`}
          role="dialog"
          aria-modal="true"
          aria-label="QR Code Full Size"
          onClick={(e) => {
            if (!(e.target instanceof Element)) return;
            const closeEl = e.target.closest('[data-close="true"]');
            if (closeEl) setQrOpen(false);
          }}
        >
          <div className="modal__backdrop" data-close="true" />
          <div className="modal__panel">
            <div className="modal__head">
              <div className="modal__title">My QR Code</div>
              <button className="iconbtn iconbtn--dark" type="button" data-close="true" aria-label="Close">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6 6l12 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                  <path d="M18 6 6 18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <div className="modal__body">
              <img src={qrUrl} alt="QR Code Full" />
            </div>
          </div>
        </div>
      </main>

      <footer className="footer">
        <div>© 2025 La Consolacion University Philippines. All rights reserved.</div>
        <button className="help" type="button" title="Help" aria-label="Help">
          ?
        </button>
      </footer>
    </>
  );
}
