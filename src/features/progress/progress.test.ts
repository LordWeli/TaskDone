import { at, task } from '../../test/factories';
import { dailyProgress } from './progress';

describe('dailyProgress', () => {
  it('is 0 of 0 with no tasks', () => {
    expect(dailyProgress([], '2026-11-09')).toEqual({ done: 0, total: 0, fraction: 0 });
  });

  it('counts open tasks and tasks done today, ignoring earlier days', () => {
    const tasks = [
      task(),
      task({ completedAt: at(2026, 11, 9, 9) }),
      task({ completedAt: at(2026, 11, 8, 9) }),
    ];
    expect(dailyProgress(tasks, '2026-11-09')).toEqual({ done: 1, total: 2, fraction: 0.5 });
  });
});
