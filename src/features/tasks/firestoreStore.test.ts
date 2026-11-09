import type { Firestore } from 'firebase/firestore';
import { stats, task } from '../../test/factories';
import { taskToDoc } from './firestoreMapping';

type SnapCallback = (snap: unknown) => void;

const mocks = vi.hoisted(() => ({
  listeners: new Map<string, (snap: unknown) => void>(),
  batch: { set: vi.fn(), delete: vi.fn(), commit: vi.fn(() => Promise.resolve()) },
}));

vi.mock('firebase/firestore', () => ({
  collection: (_db: unknown, ...path: string[]) => ({ path: path.join('/') }),
  doc: (parent: { path: string } | unknown, ...path: string[]) => {
    const base =
      typeof parent === 'object' && parent && 'path' in parent
        ? (parent as { path: string }).path
        : '';
    return { path: [base, ...path].filter(Boolean).join('/') };
  },
  onSnapshot: (ref: { path: string }, next: SnapCallback) => {
    mocks.listeners.set(ref.path, next);
    return () => mocks.listeners.delete(ref.path);
  },
  writeBatch: () => mocks.batch,
}));

const { createFirestoreStore } = await import('./firestoreStore');
const db = {} as Firestore;

function emitTasks(tasks: ReturnType<typeof task>[]) {
  mocks.listeners.get('users/u1/tasks')?.({
    docs: tasks.map((t) => ({ id: t.id, data: () => taskToDoc(t) })),
  });
}
function emitStats(data: unknown) {
  mocks.listeners.get('users/u1/stats/summary')?.({
    exists: () => data !== undefined,
    data: () => data,
  });
}

beforeEach(() => {
  mocks.listeners.clear();
  vi.clearAllMocks();
});

describe('createFirestoreStore', () => {
  it('listens to the user tasks and stats only while subscribed', () => {
    const store = createFirestoreStore(db, 'u1');
    const off = store.subscribe(() => {});
    expect([...mocks.listeners.keys()].sort()).toEqual([
      'users/u1/stats/summary',
      'users/u1/tasks',
    ]);
    off();
    expect(mocks.listeners.size).toBe(0);
  });

  it('is loaded only after both tasks and stats arrive', () => {
    const store = createFirestoreStore(db, 'u1');
    store.subscribe(() => {});
    emitTasks([task({ id: 'a' })]);
    expect(store.getSnapshot().loaded).toBe(false);
    emitStats(undefined);
    expect(store.getSnapshot()).toMatchObject({ loaded: true, stats: stats() });
    expect(store.getSnapshot().tasks.map((t) => t.id)).toEqual(['a']);
  });

  it('commits a task and its stats in one batch, showing the change at once', async () => {
    const store = createFirestoreStore(db, 'u1');
    const listener = vi.fn();
    store.subscribe(listener);
    const t = task({ id: 'a', completedAt: 5, xpAwarded: 10 });
    const s = stats({ totalXp: 10 });

    await store.commit({ put: [t], remove: ['b'], stats: s });

    expect(store.getSnapshot().tasks).toEqual([t]);
    expect(store.getSnapshot().stats.totalXp).toBe(10);
    expect(listener).toHaveBeenCalled();
    expect(mocks.batch.set).toHaveBeenCalledWith({ path: 'users/u1/tasks/a' }, taskToDoc(t));
    expect(mocks.batch.delete).toHaveBeenCalledWith({ path: 'users/u1/tasks/b' });
    expect(mocks.batch.set).toHaveBeenCalledWith({ path: 'users/u1/stats/summary' }, s);
    expect(mocks.batch.commit).toHaveBeenCalledTimes(1);
  });

  it('does not throw when the server rejects a write', async () => {
    mocks.batch.commit.mockImplementationOnce(() => Promise.reject(new Error('denied')));
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const store = createFirestoreStore(db, 'u1');
    await expect(store.commit({ put: [task()] })).resolves.toBeUndefined();
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});
