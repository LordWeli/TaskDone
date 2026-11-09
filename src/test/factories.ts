import { initialStats, type Stats } from '../features/gamification/stats';
import type { Task } from '../features/tasks/model';

/** Local time helper: month is 1-based. */
export function at(y: number, m: number, d: number, h = 12, min = 0): number {
  return new Date(y, m - 1, d, h, min).getTime();
}

let seq = 0;
export function task(overrides: Partial<Task> = {}): Task {
  seq += 1;
  return {
    id: `t${seq}`,
    title: `Task ${seq}`,
    createdAt: at(2026, 11, 9, 8),
    completedAt: null,
    xpAwarded: 0,
    ...overrides,
  };
}

export function stats(overrides: Partial<Stats> = {}): Stats {
  return { ...initialStats(), ...overrides };
}
