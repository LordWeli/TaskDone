import { useMemo } from 'react';
import { BADGES } from '../../config/gamification';
import { useToday } from '../../lib/useToday';
import { useSnapshot } from '../tasks/StoreProvider';
import { levelProgress, streakNeedsToday, visibleStreak } from './rules';

export interface BadgeView {
  id: string;
  name: string;
  description: string;
  unlockedAt: number | null;
}

/** Everything the header and the badge list render. */
export function useGamification() {
  const { stats } = useSnapshot();
  const day = useToday();
  return useMemo(() => {
    const badges: BadgeView[] = BADGES.map((b) => ({
      id: b.id,
      name: b.name,
      description: b.description,
      unlockedAt: stats.badges[b.id] ?? null,
    }));
    return {
      totalXp: stats.totalXp,
      ...levelProgress(stats.totalXp),
      streak: visibleStreak(stats, day),
      streakNeedsToday: streakNeedsToday(stats, day),
      longestStreak: stats.longestStreak,
      badges,
      unlockedCount: badges.filter((b) => b.unlockedAt !== null).length,
    };
  }, [stats, day]);
}

export type GamificationView = ReturnType<typeof useGamification>;
