import { useCallback, useRef, useState } from 'react';
import type { GamificationEvents } from '../features/gamification/rules';
import { StatsHeader } from '../features/gamification/StatsHeader';
import { useGamification } from '../features/gamification/useGamification';
import { ProgressRing } from '../features/progress/ProgressRing';
import { useDailyProgress } from '../features/progress/useDailyProgress';
import { AddTaskForm } from '../features/tasks/AddTaskForm';
import { TaskList } from '../features/tasks/TaskList';
import { useTasks } from '../features/tasks/useTasks';
import { useTaskFeedback } from './feedback/useTaskFeedback';
import './Dashboard.css';

export interface Account {
  email: string;
  onSignOut: () => void;
}

export function Dashboard({ account }: { account?: Account }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [celebration, setCelebration] = useState({
    xpPop: null as { amount: number; key: number } | null,
    levelUpKey: 0,
    perfectDayKey: 0,
  });
  const onCelebrate = useCallback((events: GamificationEvents) => {
    setCelebration((c) => ({
      xpPop: { amount: events.xpDelta, key: (c.xpPop?.key ?? 0) + 1 },
      levelUpKey: events.levelAfter > events.levelBefore ? c.levelUpKey + 1 : c.levelUpKey,
      perfectDayKey: events.perfectDay ? c.perfectDayKey + 1 : c.perfectDayKey,
    }));
  }, []);
  const feedback = useTaskFeedback({ onCelebrate });
  const { open, done, loaded, add, toggle, remove } = useTasks(feedback);
  const progress = useDailyProgress();
  const gamification = useGamification();

  return (
    <div className="dashboard">
      <header className="dashboard__header">
        <h1 className="visually-hidden">TaskDone</h1>
        <StatsHeader
          view={gamification}
          xpPop={celebration.xpPop}
          levelUpKey={celebration.levelUpKey}
        />
      </header>
      <main className="dashboard__main">
        <div className="dashboard__add">
          <AddTaskForm onAdd={add} inputRef={inputRef} />
        </div>
        <ProgressRing progress={progress} celebrateKey={celebration.perfectDayKey} />
        {loaded ? (
          <TaskList
            open={open}
            done={done}
            onToggle={toggle}
            onDelete={remove}
            onEmptyFocus={() => inputRef.current?.focus()}
          />
        ) : (
          <p className="dashboard__loading" role="status">
            Loading your tasks…
          </p>
        )}
      </main>
      {account && (
        <footer className="dashboard__footer">
          <p className="dashboard__account">
            Signed in as <bdi>{account.email}</bdi>
          </p>
          <button type="button" className="dashboard__signout" onClick={account.onSignOut}>
            Sign out
          </button>
        </footer>
      )}
    </div>
  );
}
