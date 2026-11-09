import type { FirebaseOptions } from 'firebase/app';

const env = import.meta.env;

/** Web config from .env.local. Kept apart from the SDK so checking it costs no bundle size. */
export const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
};

/** False when .env.local is missing: the app then runs on local storage only. */
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId,
);

// Safe once isFirebaseConfigured is true: the required keys are present.
export const firebaseOptions = firebaseConfig as FirebaseOptions;
