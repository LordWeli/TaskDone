import type { BadgeId } from '../../config/gamification';
import type { DayKey } from '../../lib/date';

export interface StreakSnapshot {
  currentStreak: number;
  longestStreak: number;
  lastActiveDay: DayKey | null;
}

export interface Stats {
  totalXp: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
  /** Last local day with at least one completion. */
  lastActiveDay: DayKey | null;
  /** Badge id -> unlock time (ms since epoch). Badges are never taken away. */
  badges: Partial<Record<BadgeId, number>>;
  /** Total completions minus undone completions. Drives the task-count badges. */
  tasksCompleted: number;
  /** Completions still standing on `lastActiveDay`; when an undo drops it to 0 the streak rolls back. */
  activeDayCompletions: number;
  /** Streak values from before `lastActiveDay` became active, used to roll back. */
  streakBefore: StreakSnapshot | null;
  /** Perfect-day bonus granted, so undo can take back exactly that amount. */
  perfectDay: { day: DayKey; xp: number } | null;
}

export function initialStats(): Stats {
  return {
    totalXp: 0,
    level: 1,
    currentStreak: 0,
    longestStreak: 0,
    lastActiveDay: null,
    badges: {},
    tasksCompleted: 0,
    activeDayCompletions: 0,
    streakBefore: null,
    perfectDay: null,
  };
}
