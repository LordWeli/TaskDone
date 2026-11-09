import { toDayKey } from '../../lib/date';
import { applyCompletion, applyUncompletion, type GamificationEvents } from '../gamification/rules';
import { createTask, normalizeTitle, tasksForDay, type Task } from './model';
import { applyMutation, type Mutation, type StoreSnapshot } from './store';

/**
 * Pure builders: each turns the current snapshot and an intent into one atomic
 * mutation (tasks and stats together, so XP never drifts).
 */

export function buildAdd(
  title: string,
  now: number,
  id: string,
): { mutation: Mutation; task: Task } | null {
  const clean = normalizeTitle(title);
  if (clean === null) return null;
  const task = createTask(clean, now, id);
  return { mutation: { put: [task] }, task };
}

export function buildToggle(
  snapshot: StoreSnapshot,
  taskId: string,
  now: number,
): { mutation: Mutation; task: Task; events: GamificationEvents } | null {
  const task = snapshot.tasks.find((t) => t.id === taskId);
  if (!task) return null;

  if (task.completedAt === null) {
    const draft: Task = { ...task, completedAt: now };
    const dayTasks = tasksForDay(applyMutation(snapshot, { put: [draft] }).tasks, toDayKey(now));
    const result = applyCompletion(snapshot.stats, now, dayTasks);
    const done: Task = { ...draft, xpAwarded: result.taskXp };
    return { mutation: { put: [done], stats: result.stats }, task: done, events: result.events };
  }

  const result = applyUncompletion(snapshot.stats, task);
  const reopened: Task = { ...task, completedAt: null, xpAwarded: 0 };
  return {
    mutation: { put: [reopened], stats: result.stats },
    task: reopened,
    events: result.events,
  };
}

/** Deleting never changes XP, even for a done task (SPEC 7). */
export function buildDelete(
  snapshot: StoreSnapshot,
  taskId: string,
): { mutation: Mutation; task: Task } | null {
  const task = snapshot.tasks.find((t) => t.id === taskId);
  if (!task) return null;
  return { mutation: { remove: [taskId] }, task };
}

/** Undo a delete: put the task back exactly as it was. */
export function buildRestore(task: Task): Mutation {
  return { put: [task] };
}
