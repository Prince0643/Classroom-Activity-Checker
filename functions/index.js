import cors from 'cors';
import crypto from 'crypto';
import { initializeApp } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';
import { onUserCreated } from 'firebase-functions/v2/auth';
import { onCall, onRequest, HttpsError } from 'firebase-functions/v2/https';

initializeApp();

const corsHandler = cors({ origin: true });

const getSecret = () => {
  const secret = process.env.TIMELOG_QR_SECRET;
  if (!secret) throw new Error('Missing TIMELOG_QR_SECRET env var.');
  return secret;
};

const b64url = (buf) =>
  Buffer.from(buf)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');

const b64urlDecode = (s) => {
  const pad = '='.repeat((4 - (s.length % 4)) % 4);
  const b64 = (s + pad).replace(/-/g, '+').replace(/_/g, '/');
  return Buffer.from(b64, 'base64');
};

const sign = (payload) => {
  const json = JSON.stringify(payload);
  const data = b64url(Buffer.from(json, 'utf8'));
  const mac = crypto.createHmac('sha256', getSecret()).update(data).digest();
  const sig = b64url(mac);
  return `CACHE_TL2.${data}.${sig}`;
};

const verify = (token) => {
  const s = String(token || '').trim();
  const m = s.match(/^CACHE_TL2\.([A-Za-z0-9_-]+)\.([A-Za-z0-9_-]+)$/);
  if (!m) return null;
  const [, data, sig] = m;
  const mac = crypto.createHmac('sha256', getSecret()).update(data).digest();
  const expected = b64url(mac);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const json = b64urlDecode(data).toString('utf8');
    return JSON.parse(json);
  } catch {
    return null;
  }
};

const weekdayLong = (d) =>
  d.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'Asia/Manila' });

const timeToMinutes = (t) => {
  if (t == null) return null;
  if (typeof t === 'number') {
    const d = new Date(t);
    if (Number.isNaN(d.getTime())) return null;
    return d.getHours() * 60 + d.getMinutes();
  }
  const s = String(t).trim();
  const m24 = s.match(/^(\d{1,2}):(\d{2})$/);
  if (m24) return Number(m24[1]) * 60 + Number(m24[2]);
  const m12 = s.match(/^(\d{1,2}):(\d{2})\s*([AP]M)$/i);
  if (m12) {
    let h = Number(m12[1]) % 12;
    if (String(m12[3]).toUpperCase() === 'PM') h += 12;
    return h * 60 + Number(m12[2]);
  }
  return null;
};

const findCurrentSchedule = (schedules, now) => {
  const day = weekdayLong(now);
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const candidates = (schedules || [])
    .filter((s) => String(s.fixed?.day || '') === day)
    .map((s) => ({ s, start: timeToMinutes(s.fixed?.timeStart), end: timeToMinutes(s.fixed?.timeEnd) }))
    .filter((x) => x.start != null && x.end != null && x.start <= nowMins && nowMins <= x.end);
  if (!candidates.length) return null;
  candidates.sort((a, b) => Number(a.start) - Number(b.start));
  return candidates[0].s;
};

export const mintTimeLogQr = onCall(async (req) => {
  const uid = req.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'Login required.');

  // Keep payload minimal; server verifies signature.
  const payload = {
    uid,
    type: 'professor_time_card',
    iat: Date.now(),
  };
  const token = sign(payload);
  // Persist for convenience so the Profile page can render a stable QR link.
  try {
    const db = getDatabase();
    await db.ref(`users/${uid}/timeLogQrToken`).set(token);
  } catch {
    // ignore write errors; token is still returned
  }
  return { token };
});

export const onAuthUserCreated = onUserCreated(async (event) => {
  const uid = event.data?.uid;
  if (!uid) return;
  const payload = {
    uid,
    type: 'professor_time_card',
    iat: Date.now(),
  };
  const token = sign(payload);
  const db = getDatabase();
  await db.ref(`users/${uid}/timeLogQrToken`).set(token);
});

export const publicTimeLog = onRequest((req, res) => {
  corsHandler(req, res, async () => {
    try {
      const token = String(req.query.t || '');
      const payload = verify(token);
      if (!payload?.uid) {
        res.status(400).send('Invalid QR token');
        return;
      }

      const db = getDatabase();
      const now = new Date();
      const nowMs = Date.now();
      const dateIso = now.toISOString().slice(0, 10);
      const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

      // Determine IN/OUT by latest log today for this uid.
      const logsSnap = await db.ref('timeLogs').orderByChild('professorUid').equalTo(payload.uid).get();
      const logs = [];
      logsSnap.forEach((c) => {
        const v = c.val();
        logs.push({ id: c.key, ...v });
      });
      logs.sort((a, b) => Number(b.timestamp || 0) - Number(a.timestamp || 0));
      const last = logs[0] || null;
      const type = last?.type === 'IN' ? 'OUT' : 'IN';

      // Load schedules for this professor and auto-pick current schedule.
      const schedSnap = await db.ref('schedules').orderByChild('professorUid').equalTo(payload.uid).get();
      const schedules = [];
      schedSnap.forEach((c) => schedules.push({ id: c.key, ...c.val() }));
      const current = findCurrentSchedule(schedules, now);
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

      const logRef = db.ref('timeLogs').push();
      await logRef.set({
        professorUid: payload.uid,
        professorName: '', // optional; can be filled by client/admin UI later
        employeeId: '',
        scheduleId,
        scheduleDetails,
        type,
        timestamp: nowMs,
        date: dateIso,
        time: timeStr,
        scannedVia: 'public_qr',
        qrData: token,
        status: 'on_time',
        createdAt: nowMs,
      });

      if (scheduleId) {
        if (type === 'IN') await db.ref(`schedules/${scheduleId}/live`).update({ tapInAt: nowMs, updatedAt: nowMs });
        else await db.ref(`schedules/${scheduleId}/live`).update({ tapOutAt: nowMs, updatedAt: nowMs });
      }

      // Redirect back to the app if a return URL is provided, otherwise show a simple confirmation.
      const ret = String(req.query.r || '').trim();
      if (ret) {
        const u = new URL(ret);
        u.searchParams.set('timelog_result', 'ok');
        u.searchParams.set('timelog_type', type);
        res.redirect(302, u.toString());
        return;
      }
      res.status(200).send(`OK (${type})`);
    } catch (e) {
      res.status(500).send(e?.message || 'Server error');
    }
  });
});
