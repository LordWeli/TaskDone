import { useMemo } from 'react';
import { taskCheckboxId } from '../../features/tasks/ids';
import type { TaskCallbacks } from '../../features/tasks/useTasks';
import { useAnnounce } from './Announcer';
import { useToast } from './Toaster';

/** Screen-reader announcements and snackbars for task actions. */
export function useTaskFeedback(): TaskCallbacks {
  const announce = useAnnounce();
  const { show, clearActions } = useToast();

  return useMemo<TaskCallbacks>(
    () => ({
      onAdded: (task) => {
        clearActions();
        announce(`Added ${task.title}.`);
      },
      onToggled: (task) => {
        clearActions();
        announce(
          task.completedAt !== null
            ? `Completed ${task.title}.`
            : `${task.title} moved back to To do.`,
        );
      },
      onDeleted: (task, undo) => {
        announce(`Deleted ${task.title}. Undo is available.`);
        show({ message: 'Task deleted', action: { label: 'Undo', onAction: undo } });
      },
      onRestored: (task) => {
        announce(`Restored ${task.title}.`);
        // The Undo button disappears; put focus on the task that came back.
        requestAnimationFrame(() => document.getElementById(taskCheckboxId(task.id))?.focus());
      },
    }),
    [announce, show, clearActions],
  );
}
