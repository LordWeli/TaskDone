import { useMemo } from 'react';
import { BADGES, PERFECT_DAY_BONUS_XP } from '../../config/gamification';
import type { GamificationEvents } from '../../features/gamification/rules';
import { taskCheckboxId } from '../../features/tasks/ids';
import type { TaskCallbacks } from '../../features/tasks/useTasks';
import { useAnnounce } from './Announcer';
import { useToast } from './Toaster';

const badgeName = (id: string) => BADGES.find((b) => b.id === id)?.name ?? id;

interface Options {
  /** Visual celebrations for a completion (floating XP, level pop, perfect-day burst). */
  onCelebrate?: (events: GamificationEvents) => void;
}

/** Screen-reader announcements, snackbars and celebrations for task actions. */
export function useTaskFeedback({ onCelebrate }: Options = {}): TaskCallbacks {
  const announce = useAnnounce();
  const { show, clearActions } = useToast();

  return useMemo<TaskCallbacks>(() => {
    // One toast per completion, however many things it unlocked.
    const celebrate = (events: GamificationEvents) => {
      const lines: string[] = [];
      if (events.perfectDay)
        lines.push(`Perfect day. Every task done, +${PERFECT_DAY_BONUS_XP} bonus XP.`);
      if (events.levelAfter > events.levelBefore) lines.push(`Level ${events.levelAfter} reached.`);
      for (const id of events.badgesUnlocked) lines.push(`Badge unlocked: ${badgeName(id)}.`);
      if (lines.length === 0) return;
      show({ message: lines.join('\n'), tone: 'celebrate' });
      announce(lines.join(' '));
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
          onCelebrate?.(events);
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
  }, [announce, show, clearActions, onCelebrate]);
}
