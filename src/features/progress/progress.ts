import type { DayKey } from '../../lib/date';
import { isDone, tasksForDay, type Task } from '../tasks/model';

export interface DailyProgress {
  done: number;
  total: number;
  /** 0..1; 0 when there are no tasks */
  fraction: number;
}

export function dailyProgress(tasks: readonly Task[], day: DayKey): DailyProgress {
  const dayTasks = tasksForDay(tasks, day);
  const done = dayTasks.filter(isDone).length;
  const total = dayTasks.length;
  return { done, total, fraction: total === 0 ? 0 : done / total };
}
