import { initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';

const env = import.meta.env;

/**
 * Firebase web config is public by design: access control lives in
 * firestore.rules and Firebase Auth, not in these identifiers. Restrict the
 * key to your domains in the Google Cloud console anyway.
 */
const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID,
};

const missing = (['apiKey', 'authDomain', 'projectId', 'appId'] as const).filter(k => !firebaseConfig[k]);
if (missing.length && env.DEV) {
  console.error(`Firebase config is missing: ${missing.join(', ')}. Copy .env.example to .env and fill it in.`);
}

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Local development against the Firebase emulator suite: `npm run emulators` then `VITE_USE_EMULATORS=true npm run dev`.
if (env.DEV && env.VITE_USE_EMULATORS === 'true') {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  connectFirestoreEmulator(db, '127.0.0.1', 8085);
}

export { auth, db };
