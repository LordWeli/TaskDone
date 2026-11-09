import {
  BADGES,
  PERFECT_DAY_BONUS_XP,
  PERFECT_DAY_MIN_TASKS,
  XP_PER_TASK,
  levelForXp,
  xpForLevel,
} from '../../config/gamification';
import { at, stats, task } from '../../test/factories';
import {
  applyCompletion,
  applyUncompletion,
  isPerfectDay,
  levelProgress,
  streakNeedsToday,
  visibleStreak,
} from './rules';

const done = (when: number) => task({ completedAt: when, xpAwarded: XP_PER_TASK });

describe('level curve', () => {
  it.each([
    [0, 1],
    [49, 1],
    [50, 2],
    [199, 2],
    [200, 3],
    [450, 4],
  ])('%i XP is level %i', (xp, level) => {
    expect(levelForXp(xp)).toBe(level);
  });

  it('xpForLevel inverts levelForXp', () => {
    for (let level = 1; level < 20; level++) {
      expect(levelForXp(xpForLevel(level))).toBe(level);
      expect(levelForXp(xpForLevel(level) - 1)).toBe(Math.max(1, level - 1));
    }
  });

  it('reports progress inside the level', () => {
    expect(levelProgress(125)).toEqual({
      level: 2,
      xpIntoLevel: 75,
      xpForNext: 150,
      fraction: 0.5,
    });
    expect(levelProgress(0).fraction).toBe(0);
  });
});

describe('applyCompletion', () => {
  const now = at(2026, 11, 9, 10);

  it('awards task XP and counts the completion', () => {
    const r = applyCompletion(stats(), now, [done(now)]);
    expect(r.taskXp).toBe(XP_PER_TASK);
    expect(r.stats.totalXp).toBe(XP_PER_TASK);
    expect(r.stats.tasksCompleted).toBe(1);
    expect(r.events.xpDelta).toBe(XP_PER_TASK);
  });

  it('starts a streak on the first completion ever', () => {
    const r = applyCompletion(stats(), now, [done(now)]);
    expect(r.stats.currentStreak).toBe(1);
    expect(r.stats.longestStreak).toBe(1);
    expect(r.stats.lastActiveDay).toBe('2026-11-09');
    expect(r.stats.activeDayCompletions).toBe(1);
  });

  it('extends the streak the day after an active day', () => {
    const s = stats({ currentStreak: 4, longestStreak: 4, lastActiveDay: '2026-11-08' });
    const r = applyCompletion(s, now, [done(now)]);
    expect(r.stats.currentStreak).toBe(5);
    expect(r.stats.longestStreak).toBe(5);
    expect(r.stats.streakBefore).toEqual({
      currentStreak: 4,
      longestStreak: 4,
      lastActiveDay: '2026-11-08',
    });
  });

  it('does not extend the streak twice on the same day', () => {
    const s = stats({
      currentStreak: 2,
      longestStreak: 2,
      lastActiveDay: '2026-11-09',
      activeDayCompletions: 1,
    });
    const r = applyCompletion(s, now, [done(now)]);
    expect(r.stats.currentStreak).toBe(2);
    expect(r.stats.activeDayCompletions).toBe(2);
  });

  it('restarts at 1 after a whole day without completions, keeping the longest', () => {
    const s = stats({ currentStreak: 6, longestStreak: 9, lastActiveDay: '2026-11-07' });
    const r = applyCompletion(s, now, [done(now)]);
    expect(r.stats.currentStreak).toBe(1);
    expect(r.stats.longestStreak).toBe(9);
  });

  it('counts the day by local midnight: 23:59 and 00:00 are different days', () => {
    const lateNight = at(2026, 11, 8, 23, 59);
    const first = applyCompletion(stats(), lateNight, [done(lateNight)]);
    const justAfter = at(2026, 11, 9, 0, 0);
    const second = applyCompletion(first.stats, justAfter, [done(justAfter)]);
    expect(first.stats.lastActiveDay).toBe('2026-11-08');
    expect(second.stats.lastActiveDay).toBe('2026-11-09');
    expect(second.stats.currentStreak).toBe(2);
  });

  it('keeps the streak across a DST change', () => {
    // US DST ends 2026-11-01 (America/New_York, the test zone).
    const s = stats({ currentStreak: 1, longestStreak: 1, lastActiveDay: '2026-10-31' });
    const r = applyCompletion(s, at(2026, 11, 1, 23, 30), []);
    expect(r.stats.currentStreak).toBe(2);
  });

  it('leaves the streak alone when the clock is behind the last active day', () => {
    const s = stats({ currentStreak: 3, longestStreak: 3, lastActiveDay: '2026-11-10' });
    const r = applyCompletion(s, now, [done(now)]);
    expect(r.stats.currentStreak).toBe(3);
    expect(r.stats.lastActiveDay).toBe('2026-11-10');
    expect(r.stats.totalXp).toBe(XP_PER_TASK);
  });

  it(`adds the perfect-day bonus when all ${PERFECT_DAY_MIN_TASKS}+ tasks are done`, () => {
    const day = [done(now), done(now), done(now)];
    const r = applyCompletion(stats({ totalXp: 20, tasksCompleted: 2 }), now, day);
    expect(r.events.perfectDay).toBe(true);
    expect(r.stats.totalXp).toBe(20 + XP_PER_TASK + PERFECT_DAY_BONUS_XP);
    expect(r.events.xpDelta).toBe(XP_PER_TASK + PERFECT_DAY_BONUS_XP);
    expect(r.stats.perfectDay).toEqual({ day: '2026-11-09', xp: PERFECT_DAY_BONUS_XP });
  });

  it('gives no bonus below the minimum task count', () => {
    const r = applyCompletion(stats(), now, [done(now), done(now)]);
    expect(r.events.perfectDay).toBe(false);
    expect(r.stats.totalXp).toBe(XP_PER_TASK);
  });

  it('gives no bonus while a task is still open', () => {
    const r = applyCompletion(stats(), now, [done(now), done(now), done(now), task()]);
    expect(r.events.perfectDay).toBe(false);
  });

  it('gives the bonus only once per day', () => {
    const s = stats({ perfectDay: { day: '2026-11-09', xp: PERFECT_DAY_BONUS_XP } });
    const r = applyCompletion(s, now, [done(now), done(now), done(now), done(now)]);
    expect(r.events.perfectDay).toBe(false);
    expect(r.events.xpDelta).toBe(XP_PER_TASK);
  });

  it('reports a level up', () => {
    const r = applyCompletion(stats({ totalXp: 40, level: 1 }), now, [done(now)]);
    expect(r.events.levelBefore).toBe(1);
    expect(r.events.levelAfter).toBe(2);
    expect(r.stats.level).toBe(2);
  });

  it('unlocks First Task on the first completion only', () => {
    const first = applyCompletion(stats(), now, [done(now)]);
    expect(first.events.badgesUnlocked).toEqual(['first-task']);
    expect(first.stats.badges['first-task']).toBe(now);
    const second = applyCompletion(first.stats, now + 1000, [done(now)]);
    expect(second.events.badgesUnlocked).toEqual([]);
    expect(second.stats.badges['first-task']).toBe(now);
  });

  it.each([
    ['tasks-10', 9],
    ['tasks-100', 99],
  ])('unlocks %s at the threshold', (id, before) => {
    const r = applyCompletion(
      stats({ tasksCompleted: before, badges: { 'first-task': 1 } }),
      now,
      [],
    );
    expect(r.events.badgesUnlocked).toContain(id);
  });

  it.each([
    ['streak-3', 2],
    ['streak-7', 6],
    ['streak-30', 29],
  ])('unlocks %s when the streak reaches it', (id, before) => {
    const s = stats({ currentStreak: before, longestStreak: before, lastActiveDay: '2026-11-08' });
    const r = applyCompletion(s, now, []);
    expect(r.events.badgesUnlocked).toContain(id);
  });

  it('unlocks Perfect Day with the bonus', () => {
    const r = applyCompletion(stats(), now, [done(now), done(now), done(now)]);
    expect(r.events.badgesUnlocked).toContain('perfect-day');
  });

  it('every configured badge can be unlocked', () => {
    const s = stats({ tasksCompleted: 1000, currentStreak: 1000, lastActiveDay: '2026-11-09' });
    const r = applyCompletion(s, now, [done(now), done(now), done(now)]);
    expect(r.events.badgesUnlocked.sort()).toEqual(BADGES.map((b) => b.id).sort());
  });
});

describe('applyUncompletion', () => {
  const now = at(2026, 11, 9, 10);

  it('takes back exactly the XP the task gave', () => {
    const s = stats({
      totalXp: 100,
      level: 2,
      tasksCompleted: 5,
      lastActiveDay: '2026-11-09',
      activeDayCompletions: 2,
    });
    const t = task({ completedAt: now, xpAwarded: 7 });
    const r = applyUncompletion(s, t);
    expect(r.stats.totalXp).toBe(93);
    expect(r.stats.tasksCompleted).toBe(4);
    expect(r.events.xpDelta).toBe(-7);
  });

  it('round-trips: complete then undo restores the original stats', () => {
    const before = stats({
      totalXp: 30,
      tasksCompleted: 3,
      currentStreak: 1,
      longestStreak: 1,
      lastActiveDay: '2026-11-08',
      badges: { 'first-task': 1 },
    });
    const t = task();
    const completed = applyCompletion(before, now, [{ ...t, completedAt: now }]);
    const undone = applyUncompletion(completed.stats, {
      ...t,
      completedAt: now,
      xpAwarded: completed.taskXp,
    });
    expect(undone.stats).toEqual({ ...before, streakBefore: null });
  });

  it('keeps the streak while other completions of that day remain', () => {
    const s = stats({
      currentStreak: 3,
      longestStreak: 3,
      lastActiveDay: '2026-11-09',
      activeDayCompletions: 2,
      streakBefore: { currentStreak: 2, longestStreak: 2, lastActiveDay: '2026-11-08' },
    });
    const r = applyUncompletion(s, task({ completedAt: now, xpAwarded: 10 }));
    expect(r.stats.currentStreak).toBe(3);
    expect(r.stats.activeDayCompletions).toBe(1);
  });

  it('rolls the streak back when the last completion of the day is undone', () => {
    const s = stats({
      currentStreak: 3,
      longestStreak: 3,
      lastActiveDay: '2026-11-09',
      activeDayCompletions: 1,
      streakBefore: { currentStreak: 2, longestStreak: 2, lastActiveDay: '2026-11-08' },
    });
    const r = applyUncompletion(s, task({ completedAt: now, xpAwarded: 10 }));
    expect(r.stats.currentStreak).toBe(2);
    expect(r.stats.longestStreak).toBe(2);
    expect(r.stats.lastActiveDay).toBe('2026-11-08');
  });

  it('does not touch the streak when undoing a task done on an earlier day', () => {
    const s = stats({ currentStreak: 3, lastActiveDay: '2026-11-09', activeDayCompletions: 1 });
    const r = applyUncompletion(s, task({ completedAt: at(2026, 11, 8, 22), xpAwarded: 10 }));
    expect(r.stats.currentStreak).toBe(3);
    expect(r.stats.activeDayCompletions).toBe(1);
  });

  it('takes back the perfect-day bonus of that day', () => {
    const s = stats({
      totalXp: 55,
      tasksCompleted: 3,
      perfectDay: { day: '2026-11-09', xp: 25 },
      lastActiveDay: '2026-11-09',
      activeDayCompletions: 3,
    });
    const r = applyUncompletion(s, task({ completedAt: now, xpAwarded: 10 }));
    expect(r.stats.totalXp).toBe(20);
    expect(r.stats.perfectDay).toBeNull();
    expect(r.events.xpDelta).toBe(-35);
  });

  it('keeps a perfect-day bonus from another day', () => {
    const s = stats({ totalXp: 55, perfectDay: { day: '2026-11-08', xp: 25 } });
    const r = applyUncompletion(s, task({ completedAt: now, xpAwarded: 10 }));
    expect(r.stats.totalXp).toBe(45);
    expect(r.stats.perfectDay).not.toBeNull();
  });

  it('can lower the level but never removes badges', () => {
    const s = stats({ totalXp: 50, level: 2, tasksCompleted: 1, badges: { 'first-task': 1 } });
    const r = applyUncompletion(s, task({ completedAt: now, xpAwarded: 10 }));
    expect(r.stats.level).toBe(1);
    expect(r.stats.badges).toEqual({ 'first-task': 1 });
  });

  it('never goes below zero', () => {
    const r = applyUncompletion(stats(), task({ completedAt: now, xpAwarded: 10 }));
    expect(r.stats.totalXp).toBe(0);
    expect(r.stats.tasksCompleted).toBe(0);
  });

  it('is a no-op for an open task', () => {
    const s = stats({ totalXp: 10 });
    expect(applyUncompletion(s, task()).stats).toBe(s);
  });
});

describe('isPerfectDay', () => {
  it('needs the minimum number of tasks, all done', () => {
    const now = at(2026, 11, 9);
    expect(isPerfectDay([])).toBe(false);
    expect(isPerfectDay([done(now), done(now), done(now)])).toBe(true);
    expect(isPerfectDay([done(now), done(now), task()])).toBe(false);
  });
});

describe('visibleStreak', () => {
  const s = stats({ currentStreak: 5, lastActiveDay: '2026-11-08' });

  it('shows the streak on the active day and the day after', () => {
    expect(visibleStreak({ ...s, lastActiveDay: '2026-11-09' }, '2026-11-09')).toBe(5);
    expect(visibleStreak(s, '2026-11-09')).toBe(5);
    expect(streakNeedsToday(s, '2026-11-09')).toBe(true);
  });

  it('drops to 0 once a whole day passes with nothing done', () => {
    expect(visibleStreak(s, '2026-11-10')).toBe(0);
    expect(streakNeedsToday(s, '2026-11-10')).toBe(false);
  });

  it('is 0 before anything was ever done', () => {
    expect(visibleStreak(stats(), '2026-11-09')).toBe(0);
  });
});
