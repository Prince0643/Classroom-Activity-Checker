import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
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
  await update(ref(db, `schedules/${scheduleId}/live`), { tapInAt: serverTimestamp(), updatedAt: serverTimestamp() });
};

export const tapOutAsProfessor = async (scheduleId) => {
  await update(ref(db, `schedules/${scheduleId}/live`), { tapOutAt: serverTimestamp(), updatedAt: serverTimestamp() });
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
