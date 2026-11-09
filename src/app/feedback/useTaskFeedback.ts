import { useMemo } from 'react';
import { BADGES, PERFECT_DAY_BONUS_XP } from '../../config/gamification';
import type { GamificationEvents } from '../../features/gamification/rules';
import { taskCheckboxId } from '../../features/tasks/ids';
import type { TaskCallbacks } from '../../features/tasks/useTasks';
import { useAnnounce } from './Announcer';
import { useToast } from './Toaster';

const badgeName = (id: string) => BADGES.find((b) => b.id === id)?.name ?? id;

interface Options {
  /** Called with the net XP change of a completion, for the floating "+XP". */
  onXpGain?: (amount: number) => void;
}

/** Screen-reader announcements, snackbars and celebrations for task actions. */
export function useTaskFeedback({ onXpGain }: Options = {}): TaskCallbacks {
  const announce = useAnnounce();
  const { show, clearActions } = useToast();

  return useMemo<TaskCallbacks>(() => {
    const celebrate = (events: GamificationEvents) => {
      if (events.perfectDay) {
        const text = `Perfect day. Every task done, +${PERFECT_DAY_BONUS_XP} bonus XP.`;
        show({ message: text, tone: 'celebrate' });
        announce(text);
      }
      if (events.levelAfter > events.levelBefore) {
        show({ message: `Level ${events.levelAfter} reached`, tone: 'celebrate' });
        announce(`Level up. You reached level ${events.levelAfter}.`);
      }
      for (const id of events.badgesUnlocked) {
        const text = `Badge unlocked: ${badgeName(id)}`;
        show({ message: text, tone: 'celebrate' });
        announce(`${text}.`);
      }
    };

    return {
      onAdded: (task) => {
        clearActions();
        announce(`Added ${task.title}.`);
      },
      onToggled: (task, events) => {
        clearActions();
        if (task.completedAt !== null) {
          announce(`Completed ${task.title}. Plus ${events.xpDelta} XP.`);
          onXpGain?.(events.xpDelta);
          celebrate(events);
        } else {
          const lost = Math.abs(events.xpDelta);
          announce(
            lost > 0
              ? `${task.title} moved back to To do. Minus ${lost} XP.`
              : `${task.title} moved back to To do.`,
          );
        }
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
    };
  }, [announce, show, clearActions, onXpGain]);
}
