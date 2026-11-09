import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { firebaseOptions, isFirebaseConfigured } from './firebaseConfig';

/** The Firebase app, created once. Auth lives here; Firestore is in ./firestore (separate chunk). */
export function firebaseApp(): FirebaseApp {
  if (!isFirebaseConfigured) throw new Error('Firebase is not configured. See README.');
  return getApps().length > 0 ? getApp() : initializeApp(firebaseOptions);
}

export function firebaseAuth(): Auth {
  return getAuth(firebaseApp());
}
