import { at, task } from '../../test/factories';
import { TASK_TITLE_MAX, normalizeTitle, sortForList, tasksForDay } from './model';

describe('normalizeTitle', () => {
  it('trims and collapses whitespace', () => {
    expect(normalizeTitle('  buy   milk \n')).toBe('buy milk');
  });

  it('rejects blank titles', () => {
    expect(normalizeTitle('')).toBeNull();
    expect(normalizeTitle('   ')).toBeNull();
  });

  it(`caps titles at ${TASK_TITLE_MAX} characters`, () => {
    expect(normalizeTitle('x'.repeat(250))).toHaveLength(TASK_TITLE_MAX);
  });
});

describe('tasksForDay', () => {
  it('carries open tasks over and keeps only tasks done that day', () => {
    const oldOpen = task({ createdAt: at(2026, 11, 1) });
    const doneYesterday = task({ completedAt: at(2026, 11, 8, 23, 59) });
    const doneToday = task({ completedAt: at(2026, 11, 9, 0, 0) });
    expect(tasksForDay([oldOpen, doneYesterday, doneToday], '2026-11-09')).toEqual([
      oldOpen,
      doneToday,
    ]);
  });
});

describe('sortForList', () => {
  it('puts open tasks first, newest on top, then done tasks, latest done on top', () => {
    const a = task({ createdAt: 1 });
    const b = task({ createdAt: 2 });
    const c = task({ createdAt: 3, completedAt: 10 });
    const d = task({ createdAt: 4, completedAt: 20 });
    expect(sortForList([a, c, b, d])).toEqual({ open: [b, a], done: [d, c] });
  });
});
