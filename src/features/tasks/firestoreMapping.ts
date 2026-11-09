import { BADGES } from '../../config/gamification';
import { initialStats, type Stats, type StreakSnapshot } from '../gamification/stats';
import { TASK_TITLE_MAX, type Task } from './model';

/**
 * Plain-object <-> domain mapping for Firestore documents. Times are stored as
 * ms since epoch (numbers) because the day logic runs on the device clock.
 * Reads are defensive: a malformed document is skipped or defaulted, never thrown.
 */

export interface TaskDoc {
  title: string;
  createdAt: number;
  completedAt: number | null;
  xpAwarded: number;
}

export type StatsDoc = Stats;

const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;
const DAY = /^\d{4}-\d{2}-\d{2}$/;
const isDay = (v: unknown): v is string => typeof v === 'string' && DAY.test(v);

export function taskToDoc(task: Task): TaskDoc {
  return {
    title: task.title,
    createdAt: task.createdAt,
    completedAt: task.completedAt,
    xpAwarded: task.xpAwarded,
  };
}

export function taskFromDoc(id: string, data: unknown): Task | null {
  if (!isObj(data)) return null;
  const { title, createdAt, completedAt, xpAwarded } = data;
  if (typeof title !== 'string' || title.length === 0 || title.length > TASK_TITLE_MAX) return null;
  if (!isNum(createdAt)) return null;
  if (completedAt !== null && !isNum(completedAt)) return null;
  return { id, title, createdAt, completedAt, xpAwarded: isNum(xpAwarded) ? xpAwarded : 0 };
}

export function statsToDoc(stats: Stats): StatsDoc {
  return { ...stats, badges: { ...stats.badges } };
}

function snapshotFrom(v: unknown): StreakSnapshot | null {
  if (!isObj(v)) return null;
  if (!isNum(v.currentStreak) || !isNum(v.longestStreak)) return null;
  return {
    currentStreak: v.currentStreak,
    longestStreak: v.longestStreak,
    lastActiveDay: isDay(v.lastActiveDay) ? v.lastActiveDay : null,
  };
}

export function statsFromDoc(data: unknown): Stats {
  const base = initialStats();
  if (!isObj(data)) return base;
  const num = (key: keyof Stats) =>
    isNum(data[key]) ? (data[key] as number) : (base[key] as number);
  const badges: Stats['badges'] = {};
  if (isObj(data.badges)) {
    for (const { id } of BADGES) {
      const at = data.badges[id];
      if (isNum(at)) badges[id] = at;
    }
  }
  const perfect = data.perfectDay;
  return {
    totalXp: num('totalXp'),
    level: num('level'),
    currentStreak: num('currentStreak'),
    longestStreak: num('longestStreak'),
    lastActiveDay: isDay(data.lastActiveDay) ? data.lastActiveDay : null,
    badges,
    tasksCompleted: num('tasksCompleted'),
    activeDayCompletions: num('activeDayCompletions'),
    streakBefore: snapshotFrom(data.streakBefore),
    perfectDay:
      isObj(perfect) && isDay(perfect.day) && isNum(perfect.xp)
        ? { day: perfect.day, xp: perfect.xp }
        : null,
  };
}
