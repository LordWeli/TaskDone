import { toDayKey, type DayKey } from '../../lib/date';

export const TASK_TITLE_MAX = 200;

export interface Task {
  id: string;
  title: string;
  /** ms since epoch */
  createdAt: number;
  /** ms since epoch, or null while open */
  completedAt: number | null;
  /** XP this task granted when completed; 0 while open */
  xpAwarded: number;
}

/** Trim and validate a title. Returns null when it cannot become a task. */
export function normalizeTitle(raw: string): string | null {
  const title = raw.trim().replace(/\s+/g, ' ');
  if (title.length === 0) return null;
  return title.slice(0, TASK_TITLE_MAX);
}

export function createTask(title: string, now: number, id: string): Task {
  return { id, title, createdAt: now, completedAt: null, xpAwarded: 0 };
}

export function isDone(task: Task): boolean {
  return task.completedAt !== null;
}

export function completedOn(task: Task, day: DayKey): boolean {
  return task.completedAt !== null && toDayKey(task.completedAt) === day;
}

/**
 * Tasks that belong to `day`: every open task (unfinished tasks carry over)
 * plus the ones completed that day.
 */
export function tasksForDay(tasks: readonly Task[], day: DayKey): Task[] {
  return tasks.filter((t) => !isDone(t) || completedOn(t, day));
}

/** Open tasks first (newest on top), then done tasks (most recently done on top). */
export function sortForList(tasks: readonly Task[]): { open: Task[]; done: Task[] } {
  const open = tasks.filter((t) => !isDone(t)).sort((a, b) => b.createdAt - a.createdAt);
  const done = tasks.filter(isDone).sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0));
  return { open, done };
}
