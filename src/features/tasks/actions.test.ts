import { PERFECT_DAY_BONUS_XP, XP_PER_TASK } from '../../config/gamification';
import { at, stats, task } from '../../test/factories';
import { buildAdd, buildDelete, buildRestore, buildToggle } from './actions';
import { applyMutation, type StoreSnapshot } from './store';

const now = at(2026, 11, 9, 10);

function run(snapshot: StoreSnapshot, ...steps: ((s: StoreSnapshot) => StoreSnapshot)[]) {
  return steps.reduce((s, step) => step(s), snapshot);
}
const toggle =
  (id: string, when = now) =>
  (s: StoreSnapshot) => {
    const r = buildToggle(s, id, when);
    if (!r) throw new Error('toggle failed');
    return applyMutation(s, r.mutation);
  };

describe('buildAdd', () => {
  it('creates an open task with a clean title', () => {
    const r = buildAdd('  Call mom ', now, 'id1');
    expect(r?.task).toEqual({
      id: 'id1',
      title: 'Call mom',
      createdAt: now,
      completedAt: null,
      xpAwarded: 0,
    });
    expect(r?.mutation).toEqual({ put: [r?.task] });
  });

  it('ignores blank input', () => {
    expect(buildAdd('   ', now, 'id1')).toBeNull();
  });
});

describe('buildToggle', () => {
  it('completes a task and updates stats in the same mutation', () => {
    const t = task();
    const r = buildToggle({ tasks: [t], stats: stats(), loaded: true }, t.id, now);
    expect(r?.task).toMatchObject({ completedAt: now, xpAwarded: XP_PER_TASK });
    expect(r?.mutation.stats?.totalXp).toBe(XP_PER_TASK);
    expect(r?.mutation.put).toHaveLength(1);
  });

  it('un-ticking reopens the task and removes its XP', () => {
    const t = task();
    const s = run({ tasks: [t], stats: stats(), loaded: true }, toggle(t.id), toggle(t.id));
    expect(s.tasks[0]).toMatchObject({ completedAt: null, xpAwarded: 0 });
    expect(s.stats.totalXp).toBe(0);
    expect(s.stats.currentStreak).toBe(0);
  });

  it('grants the perfect-day bonus on the last open task of the day', () => {
    const [a, b, c] = [task(), task(), task()];
    const s = run(
      { tasks: [a, b, c], stats: stats(), loaded: true },
      toggle(a.id),
      toggle(b.id),
      toggle(c.id),
    );
    expect(s.stats.totalXp).toBe(3 * XP_PER_TASK + PERFECT_DAY_BONUS_XP);
  });

  it('counts carried-over open tasks against a perfect day', () => {
    const old = task({ createdAt: at(2026, 11, 1) });
    const [a, b, c] = [task(), task(), task()];
    const s = run(
      { tasks: [old, a, b, c], stats: stats(), loaded: true },
      toggle(a.id),
      toggle(b.id),
      toggle(c.id),
    );
    expect(s.stats.perfectDay).toBeNull();
  });

  it('ignores tasks done on earlier days for a perfect day', () => {
    const yesterday = task({ completedAt: at(2026, 11, 8), xpAwarded: 10 });
    const [a, b] = [task(), task()];
    const s = run(
      { tasks: [yesterday, a, b], stats: stats(), loaded: true },
      toggle(a.id),
      toggle(b.id),
    );
    expect(s.stats.perfectDay).toBeNull();
  });

  it('returns null for an unknown task', () => {
    expect(buildToggle({ tasks: [], stats: stats(), loaded: true }, 'nope', now)).toBeNull();
  });
});

describe('buildDelete and buildRestore', () => {
  it('deleting a done task keeps the XP, and undo puts it back unchanged', () => {
    const t = task();
    const done = run({ tasks: [t], stats: stats(), loaded: true }, toggle(t.id));
    const del = buildDelete(done, t.id);
    if (!del) throw new Error('delete failed');
    expect(del.mutation.stats).toBeUndefined();
    const deleted = applyMutation(done, del.mutation);
    expect(deleted.tasks).toEqual([]);
    expect(deleted.stats.totalXp).toBe(XP_PER_TASK);
    const restored = applyMutation(deleted, buildRestore(del.task));
    expect(restored).toEqual(done);
  });
});
