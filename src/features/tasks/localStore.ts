import { initialStats, type Stats } from '../gamification/stats';
import type { Task } from './model';
import { applyMutation, type Mutation, type StoreSnapshot, type TaskStore } from './store';

const STORAGE_KEY = 'taskdone:v1';

function emptySnapshot(): StoreSnapshot {
  return { tasks: [], stats: initialStats(), loaded: true };
}

function isTask(value: unknown): value is Task {
  if (typeof value !== 'object' || value === null) return false;
  const t = value as Record<string, unknown>;
  return (
    typeof t.id === 'string' &&
    typeof t.title === 'string' &&
    typeof t.createdAt === 'number' &&
    (t.completedAt === null || typeof t.completedAt === 'number') &&
    typeof t.xpAwarded === 'number'
  );
}

function parse(raw: string | null): StoreSnapshot {
  if (!raw) return emptySnapshot();
  try {
    const data = JSON.parse(raw) as { tasks?: unknown; stats?: Partial<Stats> };
    const tasks = Array.isArray(data.tasks) ? data.tasks.filter(isTask) : [];
    return { tasks, stats: { ...initialStats(), ...data.stats }, loaded: true };
  } catch {
    return emptySnapshot();
  }
}

/** In-memory store. Used by tests and as the base of the local store. */
export function createMemoryStore(initial: StoreSnapshot = emptySnapshot()): TaskStore {
  let snapshot = initial;
  const listeners = new Set<() => void>();
  return {
    getSnapshot: () => snapshot,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    commit(mutation: Mutation) {
      snapshot = applyMutation(snapshot, mutation);
      listeners.forEach((l) => l());
      return Promise.resolve();
    },
  };
}

/**
 * Store persisted to localStorage, synced across tabs. Stand-in until the
 * Firestore implementation lands (milestone 5).
 */
export function createLocalStore(storage: Storage = window.localStorage): TaskStore {
  let snapshot = parse(storage.getItem(STORAGE_KEY));
  const listeners = new Set<() => void>();
  const notify = () => listeners.forEach((l) => l());

  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) return;
    snapshot = parse(event.newValue);
    notify();
  };

  return {
    getSnapshot: () => snapshot,
    subscribe(listener) {
      if (listeners.size === 0) window.addEventListener('storage', onStorage);
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
        if (listeners.size === 0) window.removeEventListener('storage', onStorage);
      };
    },
    commit(mutation) {
      snapshot = applyMutation(snapshot, mutation);
      try {
        storage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
      } catch {
        // Storage full or blocked: keep the in-memory state so the UI still works.
      }
      notify();
      return Promise.resolve();
    },
  };
}
