import { stats, task } from '../../test/factories';
import { createLocalStore } from './localStore';

describe('createLocalStore', () => {
  it('starts empty', () => {
    const store = createLocalStore(localStorage);
    expect(store.getSnapshot().tasks).toEqual([]);
    expect(store.getSnapshot().stats.totalXp).toBe(0);
  });

  it('persists commits and notifies subscribers', async () => {
    const store = createLocalStore(localStorage);
    const listener = vi.fn();
    store.subscribe(listener);
    const t = task();
    await store.commit({ put: [t], stats: stats({ totalXp: 10 }) });
    expect(listener).toHaveBeenCalledTimes(1);
    const reopened = createLocalStore(localStorage);
    expect(reopened.getSnapshot().tasks).toEqual([t]);
    expect(reopened.getSnapshot().stats.totalXp).toBe(10);
  });

  it('survives corrupted storage', () => {
    localStorage.setItem('taskdone:v1', '{not json');
    expect(createLocalStore(localStorage).getSnapshot().tasks).toEqual([]);
  });

  it('drops malformed tasks', () => {
    localStorage.setItem('taskdone:v1', JSON.stringify({ tasks: [{ id: 1 }, task()] }));
    expect(createLocalStore(localStorage).getSnapshot().tasks).toHaveLength(1);
  });
});
