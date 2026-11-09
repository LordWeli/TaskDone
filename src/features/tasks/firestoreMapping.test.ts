import { stats, task } from '../../test/factories';
import { statsFromDoc, statsToDoc, taskFromDoc, taskToDoc } from './firestoreMapping';

describe('task mapping', () => {
  it('round-trips a task', () => {
    const t = task({ completedAt: 123, xpAwarded: 10 });
    expect(taskFromDoc(t.id, taskToDoc(t))).toEqual(t);
  });

  it('does not store the id inside the document', () => {
    expect(taskToDoc(task())).not.toHaveProperty('id');
  });

  it.each([
    ['not an object', null],
    ['missing title', { createdAt: 1, completedAt: null, xpAwarded: 0 }],
    ['empty title', { title: '', createdAt: 1, completedAt: null, xpAwarded: 0 }],
    ['title too long', { title: 'x'.repeat(201), createdAt: 1, completedAt: null, xpAwarded: 0 }],
    ['bad createdAt', { title: 'a', createdAt: 'yesterday', completedAt: null, xpAwarded: 0 }],
    ['bad completedAt', { title: 'a', createdAt: 1, completedAt: 'now', xpAwarded: 0 }],
  ])('skips a malformed task: %s', (_, data) => {
    expect(taskFromDoc('id', data)).toBeNull();
  });
});

describe('stats mapping', () => {
  it('round-trips stats', () => {
    const s = stats({
      totalXp: 120,
      level: 2,
      currentStreak: 3,
      longestStreak: 5,
      lastActiveDay: '2026-11-09',
      badges: { 'first-task': 1, 'streak-3': 2 },
      tasksCompleted: 12,
      activeDayCompletions: 2,
      streakBefore: { currentStreak: 2, longestStreak: 5, lastActiveDay: '2026-11-08' },
      perfectDay: { day: '2026-11-09', xp: 25 },
    });
    expect(statsFromDoc(statsToDoc(s))).toEqual(s);
  });

  it('defaults a missing or corrupted document', () => {
    expect(statsFromDoc(undefined)).toEqual(stats());
    const parsed = statsFromDoc({ totalXp: 'lots', lastActiveDay: 'monday', badges: { nope: 1 } });
    expect(parsed.totalXp).toBe(0);
    expect(parsed.lastActiveDay).toBeNull();
    expect(parsed.badges).toEqual({});
  });
});
