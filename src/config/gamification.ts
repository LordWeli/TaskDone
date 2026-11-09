/**
 * Every gamification rule value lives here. Change numbers here only.
 * See SPEC.md section 7.
 */

/** XP for completing one task. */
export const XP_PER_TASK = 10;

/** Bonus XP when every task of the day is done. */
export const PERFECT_DAY_BONUS_XP = 25;

/** A day needs at least this many tasks to count as a perfect day. */
export const PERFECT_DAY_MIN_TASKS = 3;

/** XP divisor in the level curve: level = floor(sqrt(totalXp / LEVEL_XP_DIVISOR)) + 1. */
export const LEVEL_XP_DIVISOR = 50;

/** Level for a total XP amount. Level 2 at 50 XP, 3 at 200, 4 at 450. */
export function levelForXp(totalXp: number): number {
  return Math.floor(Math.sqrt(Math.max(0, totalXp) / LEVEL_XP_DIVISOR)) + 1;
}

/** Minimum total XP needed to reach a level (inverse of `levelForXp`). */
export function xpForLevel(level: number): number {
  const n = Math.max(0, level - 1);
  return n * n * LEVEL_XP_DIVISOR;
}

export type BadgeKind = 'tasksCompleted' | 'streak' | 'perfectDay';

export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  kind: BadgeKind;
  /** Count needed (tasks completed or streak days). 1 for perfectDay. */
  threshold: number;
}

export const BADGES = [
  {
    id: 'first-task',
    name: 'First Task',
    description: 'Complete your first task.',
    kind: 'tasksCompleted',
    threshold: 1,
  },
  {
    id: 'tasks-10',
    name: '10 Tasks',
    description: 'Complete 10 tasks.',
    kind: 'tasksCompleted',
    threshold: 10,
  },
  {
    id: 'tasks-100',
    name: '100 Tasks',
    description: 'Complete 100 tasks.',
    kind: 'tasksCompleted',
    threshold: 100,
  },
  {
    id: 'perfect-day',
    name: 'Perfect Day',
    description: `Finish every task of the day (${PERFECT_DAY_MIN_TASKS} or more).`,
    kind: 'perfectDay',
    threshold: 1,
  },
  {
    id: 'streak-3',
    name: '3-Day Streak',
    description: 'Get something done 3 days in a row.',
    kind: 'streak',
    threshold: 3,
  },
  {
    id: 'streak-7',
    name: '7-Day Streak',
    description: 'Get something done 7 days in a row.',
    kind: 'streak',
    threshold: 7,
  },
  {
    id: 'streak-30',
    name: '30-Day Streak',
    description: 'Get something done 30 days in a row.',
    kind: 'streak',
    threshold: 30,
  },
] as const satisfies readonly BadgeDefinition[];

export type BadgeId = (typeof BADGES)[number]['id'];
