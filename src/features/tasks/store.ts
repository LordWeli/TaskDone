import type { Stats } from '../gamification/stats';
import type { Task } from './model';

export interface StoreSnapshot {
  tasks: readonly Task[];
  stats: Stats;
  /** False until tasks and stats have been read once (from cache or server). */
  loaded: boolean;
}

/** One atomic change: task upserts, task deletions and (optionally) new stats. */
export interface Mutation {
  put?: readonly Task[];
  remove?: readonly string[];
  stats?: Stats;
}

/**
 * Storage boundary for tasks and stats. Implementations must apply a mutation
 * atomically and notify subscribers synchronously (optimistic UI).
 */
export interface TaskStore {
  getSnapshot(): StoreSnapshot;
  subscribe(listener: () => void): () => void;
  commit(mutation: Mutation): Promise<void>;
}

export function applyMutation(snapshot: StoreSnapshot, mutation: Mutation): StoreSnapshot {
  const removed = new Set(mutation.remove ?? []);
  const byId = new Map(snapshot.tasks.filter((t) => !removed.has(t.id)).map((t) => [t.id, t]));
  for (const task of mutation.put ?? []) byId.set(task.id, task);
  return { ...snapshot, tasks: [...byId.values()], stats: mutation.stats ?? snapshot.stats };
}
