import { initializeApp, type FirebaseApp, type FirebaseOptions } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from 'firebase/firestore';

export interface FirebaseServices {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
}

const env = import.meta.env;

const config = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
};

/** False when .env.local is missing: the app then runs on local storage only. */
export const isFirebaseConfigured = Boolean(config.apiKey && config.projectId && config.appId);

let services: FirebaseServices | null = null;

/** Lazily initialised Firebase. Firestore keeps a persistent IndexedDB cache for offline use. */
export function getFirebase(): FirebaseServices {
  if (!isFirebaseConfigured) throw new Error('Firebase is not configured. See README.');
  if (!services) {
    // Safe: isFirebaseConfigured checked the required keys; optional ones may be absent.
    const app = initializeApp(config as FirebaseOptions);
    const db = initializeFirestore(app, {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
    });
    services = { app, auth: getAuth(app), db };
  }
  return services;
}
