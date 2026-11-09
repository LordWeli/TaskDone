import {
  BADGES,
  PERFECT_DAY_BONUS_XP,
  PERFECT_DAY_MIN_TASKS,
  XP_PER_TASK,
  levelForXp,
  xpForLevel,
  type BadgeId,
} from '../../config/gamification';
import { daysBetween, toDayKey, type DayKey } from '../../lib/date';
import type { Task } from '../tasks/model';
import type { Stats } from './stats';

export interface GamificationEvents {
  /** Net XP change (task XP plus or minus any perfect-day bonus). */
  xpDelta: number;
  levelBefore: number;
  levelAfter: number;
  badgesUnlocked: BadgeId[];
  /** True when this completion made the day perfect. */
  perfectDay: boolean;
}

export interface CompletionResult {
  stats: Stats;
  /** XP to store on the task as `xpAwarded`. */
  taskXp: number;
  events: GamificationEvents;
}

export interface UncompletionResult {
  stats: Stats;
  events: GamificationEvents;
}

/** A day is perfect when it has enough tasks and all of them are done. */
export function isPerfectDay(dayTasks: readonly Task[]): boolean {
  return dayTasks.length >= PERFECT_DAY_MIN_TASKS && dayTasks.every((t) => t.completedAt !== null);
}

function unlockBadges(
  stats: Stats,
  now: number,
  perfectDayReached: boolean,
): { badges: Stats['badges']; unlocked: BadgeId[] } {
  const badges = { ...stats.badges };
  const unlocked: BadgeId[] = [];
  for (const badge of BADGES) {
    if (badges[badge.id] !== undefined) continue;
    const earned =
      badge.kind === 'tasksCompleted'
        ? stats.tasksCompleted >= badge.threshold
        : badge.kind === 'streak'
          ? stats.currentStreak >= badge.threshold
          : perfectDayReached;
    if (earned) {
      badges[badge.id] = now;
      unlocked.push(badge.id);
    }
  }
  return { badges, unlocked };
}

/**
 * Stats after completing a task at `now`.
 * @param dayTasksAfter the tasks of that day, with the task already marked done
 */
export function applyCompletion(
  stats: Stats,
  now: number,
  dayTasksAfter: readonly Task[],
): CompletionResult {
  const day = toDayKey(now);
  const levelBefore = stats.level;
  let next: Stats = {
    ...stats,
    totalXp: stats.totalXp + XP_PER_TASK,
    tasksCompleted: stats.tasksCompleted + 1,
  };

  // Streak: the first completion of a day activates it.
  if (next.lastActiveDay === day) {
    next.activeDayCompletions += 1;
  } else if (next.lastActiveDay === null || daysBetween(next.lastActiveDay, day) > 0) {
    const continues = next.lastActiveDay !== null && daysBetween(next.lastActiveDay, day) === 1;
    const currentStreak = continues ? next.currentStreak + 1 : 1;
    next = {
      ...next,
      streakBefore: {
        currentStreak: stats.currentStreak,
        longestStreak: stats.longestStreak,
        lastActiveDay: stats.lastActiveDay,
      },
      currentStreak,
      longestStreak: Math.max(next.longestStreak, currentStreak),
      lastActiveDay: day,
      activeDayCompletions: 1,
    };
  }
  // else: the device clock is behind the last active day; leave the streak alone.

  // Perfect-day bonus, at most once per day.
  let bonus = 0;
  const perfectDay = isPerfectDay(dayTasksAfter) && next.perfectDay?.day !== day;
  if (perfectDay) {
    bonus = PERFECT_DAY_BONUS_XP;
    next = { ...next, totalXp: next.totalXp + bonus, perfectDay: { day, xp: bonus } };
  }

  const { badges, unlocked } = unlockBadges(next, now, perfectDay);
  next = { ...next, badges, level: levelForXp(next.totalXp) };

  return {
    stats: next,
    taskXp: XP_PER_TASK,
    events: {
      xpDelta: XP_PER_TASK + bonus,
      levelBefore,
      levelAfter: next.level,
      badgesUnlocked: unlocked,
      perfectDay,
    },
  };
}

/**
 * Stats after un-ticking a done task. Takes back exactly the XP the task gave,
 * the perfect-day bonus of its day, and the streak step if it was the last
 * completion standing on the active day. Badges stay.
 * @param task the task as it was before un-ticking (still has completedAt and xpAwarded)
 */
export function applyUncompletion(stats: Stats, task: Task): UncompletionResult {
  if (task.completedAt === null) {
    return { stats, events: noEvents(stats) };
  }
  const day = toDayKey(task.completedAt);
  let next: Stats = {
    ...stats,
    totalXp: Math.max(0, stats.totalXp - task.xpAwarded),
    tasksCompleted: Math.max(0, stats.tasksCompleted - 1),
  };
  let xpDelta = -Math.min(stats.totalXp, task.xpAwarded);

  if (next.lastActiveDay === day) {
    const remaining = Math.max(0, next.activeDayCompletions - 1);
    next.activeDayCompletions = remaining;
    if (remaining === 0 && next.streakBefore) {
      next = {
        ...next,
        ...next.streakBefore,
        streakBefore: null,
      };
    }
  }

  if (next.perfectDay?.day === day) {
    const taken = Math.min(next.totalXp, next.perfectDay.xp);
    xpDelta -= taken;
    next = { ...next, totalXp: next.totalXp - taken, perfectDay: null };
  }

  next.level = levelForXp(next.totalXp);
  return {
    stats: next,
    events: {
      xpDelta,
      levelBefore: stats.level,
      levelAfter: next.level,
      badgesUnlocked: [],
      perfectDay: false,
    },
  };
}

function noEvents(stats: Stats): GamificationEvents {
  return {
    xpDelta: 0,
    levelBefore: stats.level,
    levelAfter: stats.level,
    badgesUnlocked: [],
    perfectDay: false,
  };
}

/**
 * Streak to show today. A streak survives until a whole day passes with no
 * completion, so yesterday's streak still counts while today is not done yet.
 */
export function visibleStreak(stats: Stats, today: DayKey): number {
  if (stats.lastActiveDay === null) return 0;
  const gap = daysBetween(stats.lastActiveDay, today);
  return gap <= 1 ? stats.currentStreak : 0;
}

/** True when the streak is alive but today has no completion yet. */
export function streakNeedsToday(stats: Stats, today: DayKey): boolean {
  return stats.lastActiveDay !== null && daysBetween(stats.lastActiveDay, today) === 1;
}

export interface LevelProgress {
  level: number;
  /** XP earned inside the current level */
  xpIntoLevel: number;
  /** XP the current level spans */
  xpForNext: number;
  /** 0..1 */
  fraction: number;
}

export function levelProgress(totalXp: number): LevelProgress {
  const level = levelForXp(totalXp);
  const start = xpForLevel(level);
  const span = xpForLevel(level + 1) - start;
  const xpIntoLevel = totalXp - start;
  return { level, xpIntoLevel, xpForNext: span, fraction: span > 0 ? xpIntoLevel / span : 0 };
}
