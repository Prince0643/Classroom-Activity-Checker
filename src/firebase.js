import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import { getFunctions } from 'firebase/functions';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

export { app };
export const auth = getAuth(app);
export const db = getDatabase(app);
export const functions = getFunctions(app);

let secondaryAuth = null;
export const getSecondaryAuth = () => {
  if (secondaryAuth) return secondaryAuth;
  // Use a secondary Firebase App so admin user creation doesn't switch sessions.
  const existing = getApps().find((a) => a.name === 'secondary');
  const secondaryApp = existing || initializeApp(firebaseConfig, 'secondary');
  secondaryAuth = getAuth(secondaryApp);
  return secondaryAuth;
};
