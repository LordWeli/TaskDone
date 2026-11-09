import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from 'firebase/firestore';
import { firebaseApp } from './firebase';

let db: Firestore | null = null;

/** Firestore with a persistent IndexedDB cache (offline reads and queued writes). */
export function firestore(): Firestore {
  db ??= initializeFirestore(firebaseApp(), {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
  });
  return db;
}
