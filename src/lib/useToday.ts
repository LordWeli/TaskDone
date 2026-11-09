import { useEffect, useState } from 'react';
import { msUntilNextDay, today, type DayKey } from './date';

/** Today's local day; re-renders at local midnight and when the app comes back to the foreground. */
export function useToday(): DayKey {
  const [day, setDay] = useState(() => today());

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const refresh = () => {
      setDay(today());
      clearTimeout(timer);
      timer = setTimeout(refresh, msUntilNextDay());
    };
    timer = setTimeout(refresh, msUntilNextDay());
    const onVisible = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  return day;
}
