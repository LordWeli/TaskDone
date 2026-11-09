import { useRef } from 'react';
import { ProgressRing } from '../features/progress/ProgressRing';
import { useDailyProgress } from '../features/progress/useDailyProgress';
import { AddTaskForm } from '../features/tasks/AddTaskForm';
import { TaskList } from '../features/tasks/TaskList';
import { useTaskFeedback } from './feedback/useTaskFeedback';
import { useTasks } from '../features/tasks/useTasks';
import './Dashboard.css';

export function Dashboard() {
  const inputRef = useRef<HTMLInputElement>(null);
  const feedback = useTaskFeedback();
  const { open, done, add, toggle, remove } = useTasks(feedback);
  const progress = useDailyProgress();

  return (
    <div className="dashboard">
      <header className="dashboard__header">
        <h1 className="dashboard__title">TaskDone</h1>
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
