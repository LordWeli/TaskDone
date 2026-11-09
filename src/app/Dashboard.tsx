import { useCallback, useRef, useState } from 'react';
import { StatsHeader } from '../features/gamification/StatsHeader';
import { useGamification } from '../features/gamification/useGamification';
import { ProgressRing } from '../features/progress/ProgressRing';
import { useDailyProgress } from '../features/progress/useDailyProgress';
import { AddTaskForm } from '../features/tasks/AddTaskForm';
import { TaskList } from '../features/tasks/TaskList';
import { useTasks } from '../features/tasks/useTasks';
import { useTaskFeedback } from './feedback/useTaskFeedback';
import './Dashboard.css';

export function Dashboard() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [xpPop, setXpPop] = useState<{ amount: number; key: number } | null>(null);
  const onXpGain = useCallback(
    (amount: number) => setXpPop((prev) => ({ amount, key: (prev?.key ?? 0) + 1 })),
    [],
  );
  const feedback = useTaskFeedback({ onXpGain });
  const { open, done, add, toggle, remove } = useTasks(feedback);
  const progress = useDailyProgress();
  const gamification = useGamification();

  return (
    <div className="dashboard">
      <header className="dashboard__header">
        <h1 className="visually-hidden">TaskDone</h1>
        <StatsHeader view={gamification} xpPop={xpPop} />
      </header>
      <main className="dashboard__main">
        <div className="dashboard__add">
          <AddTaskForm onAdd={add} inputRef={inputRef} />
        </div>
        <ProgressRing progress={progress} />
        <TaskList
          open={open}
          done={done}
          onToggle={toggle}
          onDelete={remove}
          onEmptyFocus={() => inputRef.current?.focus()}
        />
      </main>
    </div>
  );
}
