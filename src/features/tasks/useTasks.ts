import { useCallback, useMemo } from 'react';
import { newId } from '../../lib/id';
import { useToday } from '../../lib/useToday';
import type { GamificationEvents } from '../gamification/rules';
import { buildAdd, buildDelete, buildRestore, buildToggle } from './actions';
import { sortForList, tasksForDay, type Task } from './model';
import { useSnapshot, useStore } from './StoreProvider';

export interface TaskCallbacks {
  onAdded?: (task: Task) => void;
  onToggled?: (task: Task, events: GamificationEvents) => void;
  onDeleted?: (task: Task, undo: () => void) => void;
  onRestored?: (task: Task) => void;
}

/** Today's task list and the three daily actions. Writes are optimistic. */
export function useTasks(callbacks: TaskCallbacks = {}) {
  const store = useStore();
  const snapshot = useSnapshot();
  const day = useToday();
  const { onAdded, onToggled, onDeleted, onRestored } = callbacks;

  const { open, done } = useMemo(
    () => sortForList(tasksForDay(snapshot.tasks, day)),
    [snapshot.tasks, day],
  );

  const add = useCallback(
    (title: string): boolean => {
      const result = buildAdd(title, Date.now(), newId());
      if (!result) return false;
      void store.commit(result.mutation);
      onAdded?.(result.task);
      return true;
    },
    [store, onAdded],
  );

  const toggle = useCallback(
    (taskId: string) => {
      const current = store.getSnapshot();
      // Stats must be loaded before any write that recomputes them.
      if (!current.loaded) return;
      const result = buildToggle(current, taskId, Date.now());
      if (!result) return;
      void store.commit(result.mutation);
      onToggled?.(result.task, result.events);
    },
    [store, onToggled],
  );

  const restore = useCallback(
    (task: Task) => {
      void store.commit(buildRestore(task));
      onRestored?.(task);
    },
    [store, onRestored],
  );

  const remove = useCallback(
    (taskId: string) => {
      const result = buildDelete(store.getSnapshot(), taskId);
      if (!result) return;
      void store.commit(result.mutation);
      onDeleted?.(result.task, () => restore(result.task));
    },
    [store, onDeleted, restore],
  );

  return { day, open, done, loaded: snapshot.loaded, add, toggle, remove };
}
