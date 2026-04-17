import { createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import {
  child,
  get,
  onValue,
  orderByChild,
  push,
  query,
  ref,
  remove,
  serverTimestamp,
  set,
  update,
} from 'firebase/database';
import { auth, db } from './firebase.js';

export const watchAuth = (cb) => onAuthStateChanged(auth, cb);

export const watchTimeLogsForProfessor = (professorUid, cb) => {
  const q = query(ref(db, 'timeLogs'), orderByChild('professorUid'));
  return onValue(q, (snap) => {
    const out = [];
    snap.forEach((c) => {
      const v = c.val();
      if (v && v.professorUid === professorUid) out.push({ id: c.key, ...v });
    });
    out.sort((a, b) => Number(b.timestamp || 0) - Number(a.timestamp || 0));
    cb(out);
  });
};

export const createTimeLog = async ({
  professorUid,
  professorName,
  employeeId,
  type,
  qrData,
  scheduleId = null,
  scheduleDetails = null,
  status = 'on_time',
}) => {
  const baseRef = push(ref(db, 'timeLogs'));
  const id = baseRef.key;
  const now = Date.now();
  const d = new Date(now);
  const payload = {
    professorUid: professorUid || '',
    professorName: professorName || '',
    employeeId: employeeId || '',
    scheduleId: scheduleId || null,
    scheduleDetails: scheduleDetails || null,
    type: type || 'IN',
    timestamp: now,
    date: d.toISOString().slice(0, 10),
    time: d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
    scannedVia: 'web_qr',
    qrData: qrData || '',
    status: status || 'on_time',
    createdAt: serverTimestamp(),
  };
  await set(ref(db, `timeLogs/${id}`), payload);
  return id;
};

export const loginWithEmail = async (email, password) => {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
};

export const logout = async () => {
  await signOut(auth);
};

export const getIsAdmin = async (uid) => {
  const snap = await get(ref(db, `admins/${uid}`));
  return snap.exists() && snap.val() === true;
};

export const getOrCreateProfessorProfile = async (user) => {
  const r = ref(db, `users/${user.uid}`);
  const snap = await get(r);
  if (snap.exists()) return snap.val();

  const profile = {
    role: 'professor',
    approved: false,
    email: user.email || '',
    displayName: user.displayName || (user.email ? user.email.split('@')[0] : 'Professor'),
    createdAt: serverTimestamp(),
  };
  await set(r, profile);
  return profile;
};

export const watchPendingProfessors = (cb) => {
  const q = query(ref(db, 'users'), orderByChild('approved'));
  return onValue(q, (snap) => {
    const out = [];
    snap.forEach((c) => {
      const v = c.val();
      if (v && v.role === 'professor' && v.approved === false) out.push({ uid: c.key, ...v });
    });
    cb(out);
  });
};

export const watchAllUsers = (cb) => {
  return onValue(ref(db, 'users'), (snap) => {
    const out = [];
    snap.forEach((c) => {
      const v = c.val();
      if (v) out.push({ uid: c.key, ...v });
    });
    cb(out);
  });
};

export const approveProfessor = async (uid, approved) => {
  await update(ref(db, `users/${uid}`), { approved: !!approved, approvedAt: serverTimestamp() });
};

export const createSchedule = async (schedule) => {
  const baseRef = push(ref(db, 'schedules'));
  const id = baseRef.key;
  const payload = {
    professorUid: schedule.professorUid || '',
    fixed: {
      classroom: schedule.classroom || '',
      subject: schedule.subject || '',
      building: schedule.building || '',
      timeStart: schedule.timeStart || 0,
      timeEnd: schedule.timeEnd || 0,
      professorName: schedule.professorName || '',
    },
    live: {
      status: schedule.status || 'Scheduled',
      tapInAt: null,
      tapOutAt: null,
      updatedAt: serverTimestamp(),
    },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  await set(ref(db, `schedules/${id}`), payload);
  return id;
};

export const updateScheduleFixedAsAdmin = async (scheduleId, fixed, professorUid) => {
  const patch = {
    updatedAt: serverTimestamp(),
    'fixed/classroom': fixed.classroom,
    'fixed/subject': fixed.subject,
    'fixed/building': fixed.building,
    'fixed/timeStart': fixed.timeStart,
    'fixed/timeEnd': fixed.timeEnd,
    'fixed/professorName': fixed.professorName || '',
  };
  if (typeof professorUid === 'string') patch.professorUid = professorUid;
  await update(ref(db, `schedules/${scheduleId}`), patch);
};

export const deleteScheduleAsAdmin = async (scheduleId) => {
  await remove(ref(db, `schedules/${scheduleId}`));
};

export const watchSchedulesPublic = (cb) =>
  onValue(ref(db, 'schedules'), (snap) => {
    const out = [];
    snap.forEach((c) => {
      const v = c.val();
      out.push({ id: c.key, ...v });
    });
    cb(out);
  });

export const watchSchedulesForProfessor = (professorUid, cb) => {
  const q = query(ref(db, 'schedules'), orderByChild('professorUid'));
  return onValue(q, (snap) => {
    const out = [];
    snap.forEach((c) => {
      const v = c.val();
      if (v && v.professorUid === professorUid) out.push({ id: c.key, ...v });
    });
    cb(out);
  });
};

export const setScheduleStatusAsProfessor = async (scheduleId, status) => {
  await update(ref(db, `schedules/${scheduleId}/live`), { status, updatedAt: serverTimestamp() });
};

export const tapInAsProfessor = async (scheduleId) => {
  // Use client timestamp to satisfy RTDB rules validation (tapInAt must be a number).
  await update(ref(db, `schedules/${scheduleId}/live`), { tapInAt: Date.now(), updatedAt: serverTimestamp() });
};

export const tapOutAsProfessor = async (scheduleId) => {
  // Use client timestamp to satisfy RTDB rules validation (tapOutAt must be a number).
  await update(ref(db, `schedules/${scheduleId}/live`), { tapOutAt: Date.now(), updatedAt: serverTimestamp() });
};

export const submitChangeRequest = async (professorUid, scheduleId, changes, reason) => {
  const baseRef = push(ref(db, 'changeRequests'));
  const id = baseRef.key;
  const payload = {
    professorUid,
    scheduleId,
    changes: changes || {},
    reason: reason || '',
    status: 'pending',
    createdAt: serverTimestamp(),
  };
  await set(ref(db, `changeRequests/${id}`), payload);
  return id;
};

export const watchChangeRequests = (cb) =>
  onValue(ref(db, 'changeRequests'), (snap) => {
    const out = [];
    snap.forEach((c) => {
      const v = c.val();
      out.push({ id: c.key, ...v });
    });
    cb(out);
  });

export const reviewChangeRequestAsAdmin = async (requestId, status, adminUid) => {
  await update(ref(db, `changeRequests/${requestId}`), {
    status,
    reviewedAt: serverTimestamp(),
    reviewedBy: adminUid || '',
  });
};

export const applyChangeRequestToScheduleAsAdmin = async (request, adminUid) => {
  const scheduleSnap = await get(ref(db, `schedules/${request.scheduleId}`));
  if (!scheduleSnap.exists()) return;
  const schedule = scheduleSnap.val();

  const fixed = {
    classroom: schedule.fixed?.classroom || '',
    subject: schedule.fixed?.subject || '',
    building: schedule.fixed?.building || '',
    timeStart: schedule.fixed?.timeStart || 0,
    timeEnd: schedule.fixed?.timeEnd || 0,
    professorName: schedule.fixed?.professorName || '',
  };

  const ch = request.changes || {};
  if (typeof ch.classroom === 'string') fixed.classroom = ch.classroom;
  if (typeof ch.subject === 'string') fixed.subject = ch.subject;
  if (typeof ch.building === 'string') fixed.building = ch.building;
  if (typeof ch.timeStart === 'number') fixed.timeStart = ch.timeStart;
  if (typeof ch.timeEnd === 'number') fixed.timeEnd = ch.timeEnd;

  await update(ref(db, `schedules/${request.scheduleId}`), {
    updatedAt: serverTimestamp(),
    fixed,
  });

  await reviewChangeRequestAsAdmin(request.id, 'approved', adminUid);
};

export const getUserProfile = async (uid) => {
  const snap = await get(ref(db, `users/${uid}`));
  return snap.exists() ? snap.val() : null;
};

export const setUserProfileAsAdmin = async (uid, patch) => {
  await update(ref(db, `users/${uid}`), { ...patch, updatedAt: serverTimestamp() });
};

export const getUserEmailByUid = async (uid) => {
  const snap = await get(child(ref(db), `users/${uid}/email`));
  return snap.exists() ? String(snap.val() || '') : '';
};

export const createProfessorAsAdmin = async (email, password, profile) => {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  const uid = cred.user.uid;
  const payload = {
    role: 'professor',
    approved: true,
    email,
    displayName: profile.displayName || '',
    fullName: profile.fullName || '',
    employeeId: profile.employeeId || '',
    department: profile.department || '',
    phone: profile.phone || '',
    office: profile.office || '',
    specialization: profile.specialization || '',
    createdAt: serverTimestamp(),
    approvedAt: serverTimestamp(),
  };
  await set(ref(db, `users/${uid}`), payload);
  return { uid, email };
};

export const signUpProfessor = async (email, password, profile) => {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  const uid = cred.user.uid;
  const payload = {
    role: 'professor',
    approved: false,
    email,
    displayName: profile.displayName || '',
    fullName: profile.fullName || '',
    employeeId: profile.employeeId || '',
    department: profile.department || '',
    phone: profile.phone || '',
    office: profile.office || '',
    specialization: profile.specialization || '',
    createdAt: serverTimestamp(),
  };
  await set(ref(db, `users/${uid}`), payload);
  return { uid, email };
};

// Buildings
export const createBuilding = async (building) => {
  const baseRef = push(ref(db, 'buildings'));
  const id = baseRef.key;
  const payload = {
    name: building.name || '',
    code: building.code || '',
    location: building.location || '',
    floors: building.floors || 1,
    createdAt: serverTimestamp(),
  };
  await set(ref(db, `buildings/${id}`), payload);
  return id;
};

export const watchBuildings = (cb) =>
  onValue(ref(db, 'buildings'), (snap) => {
    const out = [];
    snap.forEach((c) => {
      const v = c.val();
      out.push({ id: c.key, ...v });
    });
    cb(out);
  });

export const deleteBuildingAsAdmin = async (buildingId) => {
  await remove(ref(db, `buildings/${buildingId}`));
};

// Classrooms
export const createClassroom = async (classroom) => {
  const baseRef = push(ref(db, 'classrooms'));
  const id = baseRef.key;
  const payload = {
    buildingId: classroom.buildingId || '',
    buildingName: classroom.buildingName || '',
    roomNumber: classroom.roomNumber || '',
    floor: classroom.floor || 1,
    capacity: classroom.capacity || 30,
    facilities: classroom.facilities || '',
    createdAt: serverTimestamp(),
  };
  await set(ref(db, `classrooms/${id}`), payload);
  return id;
};

export const watchClassrooms = (cb) =>
  onValue(ref(db, 'classrooms'), (snap) => {
    const out = [];
    snap.forEach((c) => {
      const v = c.val();
      out.push({ id: c.key, ...v });
    });
    cb(out);
  });

export const deleteClassroomAsAdmin = async (classroomId) => {
  await remove(ref(db, `classrooms/${classroomId}`));
};

// Reports
export const submitReport = async (reporterUid, reporterName, professorUid, professorName, issue, details) => {
  const baseRef = push(ref(db, 'reports'));
  const id = baseRef.key;
  const payload = {
    reporterUid: reporterUid || '',
    reporterName: reporterName || 'Anonymous',
    professorUid: professorUid || '',
    professorName: professorName || '',
    issue: issue || '',
    details: details || '',
    createdAt: serverTimestamp(),
  };
  await set(ref(db, `reports/${id}`), payload);
  return id;
};

export const watchReports = (cb) =>
  onValue(ref(db, 'reports'), (snap) => {
    const out = [];
    snap.forEach((c) => {
      const v = c.val();
      if (v) out.push({ id: c.key, ...v });
    });
    out.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    cb(out);
  });

export const deleteReportAsAdmin = async (reportId) => {
  await remove(ref(db, `reports/${reportId}`));
};
