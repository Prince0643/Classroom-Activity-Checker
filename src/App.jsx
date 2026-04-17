import React, { useEffect, useMemo, useState } from 'react';
import {
  approveProfessor,
  applyChangeRequestToScheduleAsAdmin,
  createBuilding,
  createClassroom,
  createProfessorAsAdmin,
  createSchedule,
  createTimeLog,
  deleteBuildingAsAdmin,
  deleteClassroomAsAdmin,
  deleteReportAsAdmin,
  deleteScheduleAsAdmin,
  getIsAdmin,
  getOrCreateProfessorProfile,
  getUserProfile,
  loginWithEmail,
  logout,
  reviewChangeRequestAsAdmin,
  setScheduleStatusAsProfessor,
  signUpProfessor,
  submitChangeRequest,
  submitReport,
  tapInAsProfessor,
  tapOutAsProfessor,
  watchAllUsers,
  watchAuth,
  watchBuildings,
  watchChangeRequests,
  watchClassrooms,
  watchPendingProfessors,
  watchReports,
  watchSchedulesPublic,
  watchSchedulesForProfessor,
  watchTimeLogsForProfessor,
} from './cacheApi.js';
import { pad2, makeQrUrl } from './utils/helpers.js';
import Topbar from './components/shared/Topbar.jsx';
import PublicScreen from './components/screens/PublicScreen.jsx';
import LoginScreen from './components/screens/LoginScreen.jsx';
import SignUpScreen from './components/screens/SignUpScreen.jsx';
import PendingScreen from './components/screens/PendingScreen.jsx';
import DashboardScreen from './components/screens/DashboardScreen.jsx';
import { CloseIcon } from './components/shared/Icons.jsx';
import QRScannerModal from './components/shared/QRScannerModal.jsx';

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
  const [allUsers, setAllUsers] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [reports, setReports] = useState([]);
  const [timeLogs, setTimeLogs] = useState([]);
  const [qrScannerOpen, setQrScannerOpen] = useState(false);
  const [scanBusy, setScanBusy] = useState(false);
  const [clock, setClock] = useState('--:--:--');
  const [today, setToday] = useState('---');
  const [qrOpen, setQrOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [loginBusy, setLoginBusy] = useState(false);
  const [adminCreateBusy, setAdminCreateBusy] = useState(false);
  const [profReqBusy, setProfReqBusy] = useState(false);
  const [reportSubmitBusy, setReportSubmitBusy] = useState(false);
  const [authError, setAuthError] = useState('');

  const [adminScheduleForm, setAdminScheduleForm] = useState({
    professorUid: '',
    professorName: '',
    employeeId: '',
    classroom: '',
    subject: '',
    building: '',
    day: '',
    timeStart: '',
    timeEnd: '',
  });

  const [profRequestForm, setProfRequestForm] = useState({
    scheduleId: '',
    classroom: '',
    subject: '',
    building: '',
    day: '',
    timeStart: '',
    timeEnd: '',
    reason: '',
  });

  const [createProfForm, setCreateProfForm] = useState({
    email: '',
    password: '',
    fullName: '',
    displayName: '',
    employeeId: '',
    department: '',
    phone: '',
    office: '',
    specialization: '',
  });
  const [createProfBusy, setCreateProfBusy] = useState(false);
  const [createProfError, setCreateProfError] = useState('');

  const [signUpForm, setSignUpForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    displayName: '',
    employeeId: '',
    department: '',
    phone: '',
    office: '',
    specialization: '',
  });
  const [signUpBusy, setSignUpBusy] = useState(false);
  const [signUpError, setSignUpError] = useState('');

  const [publicReportForm, setPublicReportForm] = useState({
    professorUid: '',
    issue: '',
    details: '',
  });

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        setQrOpen(false);
        setReportModalOpen(false);
      }
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
    // Always watch allUsers so everyone can see professors (for reporting)
    const unsubU = watchAllUsers(setAllUsers);
    // Watch buildings and classrooms for everyone (needed for change requests)
    const unsubB = watchBuildings(setBuildings);
    const unsubC = watchClassrooms(setClassrooms);

    // Watch reports for logged-in users (to show in Reports tab)
    let unsubRep;
    if (authUser) {
      unsubRep = watchReports(setReports);
    }

    // Admin-only watchers
    if (!isAdmin) {
      return () => {
        if (typeof unsubU === 'function') unsubU();
        if (typeof unsubB === 'function') unsubB();
        if (typeof unsubC === 'function') unsubC();
        if (typeof unsubRep === 'function') unsubRep();
      };
    }

    const unsubA = watchPendingProfessors(setPendingProfessors);
    const unsubR = watchChangeRequests(setChangeRequests);

    return () => {
      if (typeof unsubA === 'function') unsubA();
      if (typeof unsubR === 'function') unsubR();
      if (typeof unsubU === 'function') unsubU();
      if (typeof unsubB === 'function') unsubB();
      if (typeof unsubC === 'function') unsubC();
      if (typeof unsubRep === 'function') unsubRep();
    };
  }, [isAdmin, authUser]);

  useEffect(() => {
    if (!authUser || isAdmin || !profile?.approved) {
      setTimeLogs([]);
      return undefined;
    }
    const unsub = watchTimeLogsForProfessor(authUser.uid, setTimeLogs);
    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, [authUser, isAdmin, profile?.approved]);

  useEffect(() => {
    const tick = () => {
      const d = new Date();
      const hours12 = d.getHours() % 12 || 12;
      const ampm = d.getHours() >= 12 ? 'PM' : 'AM';
      setClock(`${hours12}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())} ${ampm}`);
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

  const qrUrl = useMemo(() => makeQrUrl({ ...profile, uid: authUser?.uid }), [profile, authUser?.uid]);

  const metaUser = authUser ? `Logged in as ${profile?.displayName || authUser.email || authUser.uid}` : 'Not logged in';
  const welcomeTitle = authUser ? `Welcome, ${profile?.displayName || authUser.email || 'User'}` : 'Welcome';
  const welcomeDept = profile?.department ? `${profile.department} Department` : isAdmin ? 'Administration' : 'Department';

  const parseQrPayload = (raw) => {
    const s = String(raw || '').trim();
    if (!s) return null;
    try {
      return JSON.parse(s);
    } catch {
      // QR server URLs encode JSON in `data=` query param
      try {
        const url = new URL(s);
        const dataParam = url.searchParams.get('data');
        if (dataParam) return JSON.parse(decodeURIComponent(dataParam));
      } catch {
        // ignore
      }
    }
    return null;
  };

  const timeToMinutes = (t) => {
    if (t == null) return null;
    if (typeof t === 'number') {
      const d = new Date(t);
      if (Number.isNaN(d.getTime())) return null;
      return d.getHours() * 60 + d.getMinutes();
    }
    const s = String(t).trim();
    if (!s) return null;
    // "HH:MM"
    const m24 = s.match(/^(\d{1,2}):(\d{2})$/);
    if (m24) return Number(m24[1]) * 60 + Number(m24[2]);
    // "H:MM AM/PM"
    const m12 = s.match(/^(\d{1,2}):(\d{2})\s*([AP]M)$/i);
    if (m12) {
      let h = Number(m12[1]) % 12;
      if (String(m12[3]).toUpperCase() === 'PM') h += 12;
      return h * 60 + Number(m12[2]);
    }
    return null;
  };

  const findCurrentScheduleForProfessor = (list, now = new Date()) => {
    const weekday = now.toLocaleDateString('en-US', { weekday: 'long' });
    const nowMins = now.getHours() * 60 + now.getMinutes();
    const candidates = (list || [])
      .filter((s) => String(s.fixed?.day || '') === weekday)
      .map((s) => {
        const start = timeToMinutes(s.fixed?.timeStart);
        const end = timeToMinutes(s.fixed?.timeEnd);
        return { s, start, end };
      })
      .filter((x) => x.start != null && x.end != null && x.start <= nowMins && nowMins <= x.end);

    if (!candidates.length) return null;
    // Pick earliest start (most likely intended schedule)
    candidates.sort((a, b) => Number(a.start) - Number(b.start));
    return candidates[0].s;
  };

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
        employeeId: adminScheduleForm.employeeId,
        classroom: adminScheduleForm.classroom.trim(),
        subject: adminScheduleForm.subject.trim(),
        building: adminScheduleForm.building.trim(),
        day: adminScheduleForm.day,
        timeStart: adminScheduleForm.timeStart,
        timeEnd: adminScheduleForm.timeEnd,
        status: 'Scheduled',
      });
      setAdminScheduleForm({
        professorUid: '',
        professorName: '',
        employeeId: '',
        classroom: '',
        subject: '',
        building: '',
        day: '',
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
      if (profRequestForm.day) changes.day = profRequestForm.day;
      if (profRequestForm.timeStart) changes.timeStart = profRequestForm.timeStart;
      if (profRequestForm.timeEnd) changes.timeEnd = profRequestForm.timeEnd;

      await submitChangeRequest(authUser.uid, profRequestForm.scheduleId, changes, profRequestForm.reason);
      setProfRequestForm({
        scheduleId: '',
        classroom: '',
        subject: '',
        building: '',
        day: '',
        timeStart: '',
        timeEnd: '',
        reason: '',
      });
      alert('Request submitted for admin review.');
    } finally {
      setProfReqBusy(false);
    }
  };

  const adminCreateProfessor = async () => {
    setCreateProfError('');
    setCreateProfBusy(true);
    try {
      await createProfessorAsAdmin(createProfForm.email, createProfForm.password, {
        fullName: createProfForm.fullName,
        displayName: createProfForm.displayName || createProfForm.fullName,
        employeeId: createProfForm.employeeId,
        department: createProfForm.department,
        phone: createProfForm.phone,
        office: createProfForm.office,
        specialization: createProfForm.specialization,
      });
      setCreateProfForm({
        email: '',
        password: '',
        fullName: '',
        displayName: '',
        employeeId: '',
        department: '',
        phone: '',
        office: '',
        specialization: '',
      });
      alert('Professor account created successfully!');
    } catch (err) {
      setCreateProfError(err?.message || 'Failed to create professor account');
    } finally {
      setCreateProfBusy(false);
    }
  };

  const professorSignUp = async () => {
    if (signUpForm.password !== signUpForm.confirmPassword) {
      setSignUpError('Passwords do not match');
      return;
    }
    setSignUpError('');
    setSignUpBusy(true);
    try {
      await signUpProfessor(signUpForm.email, signUpForm.password, {
        fullName: signUpForm.fullName,
        displayName: signUpForm.displayName || signUpForm.fullName,
        employeeId: signUpForm.employeeId,
        department: signUpForm.department,
        phone: signUpForm.phone,
        office: signUpForm.office,
        specialization: signUpForm.specialization,
      });
      setSignUpForm({
        email: '',
        password: '',
        confirmPassword: '',
        fullName: '',
        displayName: '',
        employeeId: '',
        department: '',
        phone: '',
        office: '',
        specialization: '',
      });
      alert('Account created! Please wait for admin approval before logging in.');
      setScreen('login');
    } catch (err) {
      setSignUpError(err?.message || 'Failed to create account');
    } finally {
      setSignUpBusy(false);
    }
  };

  const adminCreateBuilding = async (building) => {
    try {
      await createBuilding(building);
    } catch (err) {
      alert(err?.message || 'Failed to create building');
    }
  };

  const adminCreateClassroom = async (classroom) => {
    try {
      await createClassroom(classroom);
    } catch (err) {
      alert(err?.message || 'Failed to create classroom');
    }
  };

  const adminDeleteBuilding = async (buildingId) => {
    if (!confirm('Delete this building?')) return;
    try {
      await deleteBuildingAsAdmin(buildingId);
    } catch (err) {
      alert(err?.message || 'Failed to delete building');
    }
  };

  const adminDeleteClassroom = async (classroomId) => {
    if (!confirm('Delete this classroom?')) return;
    try {
      await deleteClassroomAsAdmin(classroomId);
    } catch (err) {
      alert(err?.message || 'Failed to delete classroom');
    }
  };

  const handleSubmitReport = async (professorUid, issue, details) => {
    if (!authUser) return;
    setReportSubmitBusy(true);
    try {
      const professor = allUsers.find((u) => u.uid === professorUid);
      await submitReport(
        authUser.uid,
        profile?.displayName || authUser.email || 'Anonymous',
        professorUid,
        professor?.displayName || professor?.fullName || '',
        issue,
        details
      );
      alert('Report submitted successfully!');
    } catch (err) {
      alert(err?.message || 'Failed to submit report');
    } finally {
      setReportSubmitBusy(false);
    }
  };

  const handleDeleteReport = async (reportId) => {
    if (!confirm('Delete this report?')) return;
    try {
      await deleteReportAsAdmin(reportId);
    } catch (err) {
      alert(err?.message || 'Failed to delete report');
    }
  };

  const handlePublicReportSubmit = async () => {
    if (!publicReportForm.professorUid || !publicReportForm.issue.trim()) {
      alert('Please select a professor and describe the issue');
      return;
    }
    setReportSubmitBusy(true);
    try {
      const professor = allUsers.find((u) => u.uid === publicReportForm.professorUid);
      await submitReport(
        authUser?.uid || '',
        profile?.displayName || authUser?.email || 'Anonymous',
        publicReportForm.professorUid,
        professor?.displayName || professor?.fullName || '',
        publicReportForm.issue,
        publicReportForm.details
      );
      setPublicReportForm({ professorUid: '', issue: '', details: '' });
      setReportModalOpen(false);
      alert('Report submitted successfully!');
    } catch (err) {
      alert(err?.message || 'Failed to submit report');
    } finally {
      setReportSubmitBusy(false);
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

  if (authLoading) {
    return (
      <div className="shell center" style={{ height: '100vh' }}>
        <div>Loading…</div>
      </div>
    );
  }

  const handleTimeLogScan = async (raw) => {
    if (!authUser || isAdmin) return;
    const payload = parseQrPayload(raw);
    if (!payload) {
      alert('Invalid QR data. Please scan your QR code from Profile.');
      return;
    }

    const qrUid = String(payload.uid || '').trim();
    if (qrUid && qrUid !== authUser.uid) {
      alert('This QR code does not match your account.');
      return;
    }

    const myEmail = String(profile?.email || authUser.email || '').trim().toLowerCase();
    const myId = String(profile?.employeeId || '').trim();
    const qrEmail = String(payload.email || '').trim().toLowerCase();
    const qrId = String(payload.id || payload.employeeId || '').trim();

    if ((myEmail && qrEmail && myEmail !== qrEmail) || (myId && qrId && myId !== qrId)) {
      alert('This QR code does not match your account.');
      return;
    }

    const last = timeLogs && timeLogs.length ? timeLogs[0] : null;
    const type = last?.type === 'IN' ? 'OUT' : 'IN';

    setScanBusy(true);
    try {
      const current = findCurrentScheduleForProfessor(schedules, new Date());
      const scheduleId = current?.id || null;
      const scheduleDetails = current
        ? {
            subject: current.fixed?.subject || '',
            classroom: current.fixed?.classroom || '',
            building: current.fixed?.building || '',
            day: current.fixed?.day || '',
            timeStart: current.fixed?.timeStart || '',
            timeEnd: current.fixed?.timeEnd || '',
          }
        : null;

      await createTimeLog({
        professorUid: authUser.uid,
        professorName: profile?.fullName || profile?.displayName || authUser.email || '',
        employeeId: profile?.employeeId || payload.id || '',
        type,
        qrData: String(raw || ''),
        scheduleId,
        scheduleDetails,
        status: 'on_time',
      });

      if (scheduleId) {
        if (type === 'IN') await tapInAsProfessor(scheduleId);
        else await tapOutAsProfessor(scheduleId);
      }

      setQrScannerOpen(false);
      if (activeTab !== 'timeLogs') setActiveTab('timeLogs');
    } catch (e) {
      alert(e?.message || 'Failed to record time log.');
    } finally {
      setScanBusy(false);
    }
  };

  return (
    <>
      <Topbar
        authUser={authUser}
        profile={profile}
        metaUser={metaUser}
        onLogin={() => setScreen('login')}
        onLogout={onLogout}
        onReportClick={() => setReportModalOpen(true)}
      />

      <main className="shell">
        {screen === 'public' && (
          <PublicScreen clock={clock} today={today} schedules={schedules} />
        )}

        {screen === 'pending' && (
          <PendingScreen
            onGoToPublic={() => setScreen('public')}
            onLogout={onLogout}
          />
        )}

        {screen === 'login' && (
          <LoginScreen
            onLoginSubmit={onLoginSubmit}
            onGoToPublic={() => setScreen('public')}
            onGoToSignUp={() => setScreen('signup')}
            loginBusy={loginBusy}
            authError={authError}
          />
        )}

        {screen === 'signup' && (
          <SignUpScreen
            form={signUpForm}
            onChange={setSignUpForm}
            onSubmit={professorSignUp}
            onGoToLogin={() => setScreen('login')}
            signUpBusy={signUpBusy}
            signUpError={signUpError}
          />
        )}

        {screen === 'dashboard' && (
          <DashboardScreen
            activeTab={activeTab}
            onTabChange={setActiveTab}
            isAdmin={isAdmin}
            welcomeTitle={welcomeTitle}
            welcomeDept={welcomeDept}
            schedules={schedules}
            scheduleForm={adminScheduleForm}
            onScheduleFormChange={setAdminScheduleForm}
            onCreateSchedule={adminCreateSchedule}
            onDeleteSchedule={deleteScheduleAsAdmin}
            onTapIn={tapInAsProfessor}
            onTapOut={tapOutAsProfessor}
            onStatusChange={setScheduleStatusAsProfessor}
            adminCreateBusy={adminCreateBusy}
            createProfForm={createProfForm}
            onCreateProfFormChange={setCreateProfForm}
            onCreateProfessor={adminCreateProfessor}
            createProfBusy={createProfBusy}
            createProfError={createProfError}
            pendingProfessors={pendingProfessors}
            allUsers={allUsers}
            onApproveProfessor={approveProfessor}
            changeRequests={changeRequests}
            onApproveRequest={applyChangeRequestToScheduleAsAdmin}
            onRejectRequest={reviewChangeRequestAsAdmin}
            authUser={authUser}
            profRequestForm={profRequestForm}
            onProfRequestFormChange={setProfRequestForm}
            onSubmitRequest={professorSubmitRequest}
            profReqBusy={profReqBusy}
            profile={profile}
            onViewQr={() => setQrOpen(true)}
            onDownloadQr={downloadQr}
            buildings={buildings}
            classrooms={classrooms}
            onCreateBuilding={adminCreateBuilding}
            onCreateClassroom={adminCreateClassroom}
            onDeleteBuilding={adminDeleteBuilding}
            onDeleteClassroom={adminDeleteClassroom}
            reports={reports}
            onSubmitReport={handleSubmitReport}
            onDeleteReport={handleDeleteReport}
            reportSubmitBusy={reportSubmitBusy}
            timeLogs={timeLogs}
            scanBusy={scanBusy}
            onOpenTimeLogScanner={() => setQrScannerOpen(true)}
          />
        )}
      </main>

      <QRScannerModal
        isOpen={qrScannerOpen}
        onClose={() => (scanBusy ? null : setQrScannerOpen(false))}
        onScanSuccess={handleTimeLogScan}
        scanBusy={scanBusy}
      />

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
              <CloseIcon />
            </button>
          </div>
          <div className="modal__body">
            <img src={qrUrl} alt="QR Code Full" />
          </div>
        </div>
      </div>

      {/* Public Report Modal */}
      <div
        className={`modal ${reportModalOpen ? '' : 'hidden'}`}
        role="dialog"
        aria-modal="true"
        aria-label="Report Professor"
        onClick={(e) => {
          if (!(e.target instanceof Element)) return;
          const closeEl = e.target.closest('[data-close="true"]');
          if (closeEl) setReportModalOpen(false);
        }}
      >
        <div className="modal__backdrop" data-close="true" />
        <div className="modal__panel" style={{ maxWidth: '480px' }}>
          <div className="modal__head">
            <div className="modal__title">Report a Professor</div>
            <button className="iconbtn iconbtn--dark" type="button" data-close="true" aria-label="Close">
              <CloseIcon />
            </button>
          </div>
          <div className="modal__body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <div className="cellTitle">Professor *</div>
                <select
                  className="select"
                  value={publicReportForm.professorUid}
                  onChange={(e) =>
                    setPublicReportForm({ ...publicReportForm, professorUid: e.target.value })
                  }
                >
                  <option value="">Select professor</option>
                  {allUsers
                    ?.filter((u) => u.role === 'professor')
                    .map((prof) => (
                      <option key={prof.uid} value={prof.uid}>
                        {prof.displayName || prof.fullName || prof.uid}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <div className="cellTitle">Issue *</div>
                <input
                  className="input"
                  value={publicReportForm.issue}
                  onChange={(e) =>
                    setPublicReportForm({ ...publicReportForm, issue: e.target.value })
                  }
                  placeholder="e.g. Missing class, Late arrival, etc."
                />
              </div>
              <div>
                <div className="cellTitle">Details</div>
                <textarea
                  className="input"
                  value={publicReportForm.details}
                  onChange={(e) =>
                    setPublicReportForm({ ...publicReportForm, details: e.target.value })
                  }
                  placeholder="Provide more details about the issue..."
                  rows={3}
                  style={{ resize: 'vertical', minHeight: '80px' }}
                />
              </div>
              <button
                className="btn btn--dark"
                type="button"
                onClick={handlePublicReportSubmit}
                disabled={reportSubmitBusy}
                style={{ marginTop: '8px' }}
              >
                {reportSubmitBusy ? 'Submitting…' : 'Submit Report'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
