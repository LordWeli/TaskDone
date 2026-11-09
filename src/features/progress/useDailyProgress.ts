import { useMemo } from 'react';
import { useToday } from '../../lib/useToday';
import { useSnapshot } from '../tasks/StoreProvider';
import { dailyProgress } from './progress';

export function useDailyProgress() {
  const { tasks } = useSnapshot();
  const day = useToday();
  return useMemo(() => dailyProgress(tasks, day), [tasks, day]);
}
