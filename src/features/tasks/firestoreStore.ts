import {
  collection,
  doc,
  onSnapshot,
  writeBatch,
  type Firestore,
  type Unsubscribe,
} from 'firebase/firestore';
import { initialStats } from '../gamification/stats';
import { statsFromDoc, statsToDoc, taskFromDoc, taskToDoc } from './firestoreMapping';
import type { Task } from './model';
import { applyMutation, type Mutation, type StoreSnapshot, type TaskStore } from './store';

/**
 * Firestore-backed store for one user: `users/{uid}/tasks/*` and
 * `users/{uid}/stats/summary`. Every commit is one batched write, so a task
 * change and its stats land together. The persistent cache serves reads and
 * queues writes offline; Firestore syncs when the connection returns.
 */
export function createFirestoreStore(db: Firestore, uid: string): TaskStore {
  const tasksRef = collection(db, 'users', uid, 'tasks');
  const statsRef = doc(db, 'users', uid, 'stats', 'summary');

  let snapshot: StoreSnapshot = { tasks: [], stats: initialStats(), loaded: false };
  let tasksLoaded = false;
  let statsLoaded = false;
  const listeners = new Set<() => void>();
  let unsubscribers: Unsubscribe[] = [];

  const emit = (next: Partial<StoreSnapshot>) => {
    snapshot = { ...snapshot, ...next, loaded: tasksLoaded && statsLoaded };
    listeners.forEach((l) => l());
  };

  const start = () => {
    unsubscribers = [
      onSnapshot(
        tasksRef,
        (snap) => {
          tasksLoaded = true;
          const tasks = snap.docs
            .map((d) => taskFromDoc(d.id, d.data()))
            .filter((t): t is Task => t !== null);
          emit({ tasks });
        },
        (error) => console.error('Tasks listener failed', error),
      ),
      onSnapshot(
        statsRef,
        (snap) => {
          statsLoaded = true;
          emit({ stats: snap.exists() ? statsFromDoc(snap.data()) : initialStats() });
        },
        (error) => console.error('Stats listener failed', error),
      ),
    ];
  };

  return {
    getSnapshot: () => snapshot,
    subscribe(listener) {
      if (listeners.size === 0) start();
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
        if (listeners.size === 0) {
          unsubscribers.forEach((u) => u());
          unsubscribers = [];
        }
      };
    },
    commit(mutation: Mutation) {
      // Optimistic: show the change now; Firestore's own snapshot confirms it.
      emit(applyMutation(snapshot, mutation));
      const batch = writeBatch(db);
      for (const task of mutation.put ?? []) batch.set(doc(tasksRef, task.id), taskToDoc(task));
      for (const id of mutation.remove ?? []) batch.delete(doc(tasksRef, id));
      if (mutation.stats) batch.set(statsRef, statsToDoc(mutation.stats));
      // Offline, this promise only settles after the server acknowledges; never block on it.
      return batch.commit().catch((error: unknown) => {
        console.error('Saving failed', error);
      });
    },
  };
}
