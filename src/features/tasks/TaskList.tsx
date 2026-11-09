import { useRef } from 'react';
import { taskCheckboxId } from './ids';
import type { Task } from './model';
import './TaskList.css';

interface Props {
  open: readonly Task[];
  done: readonly Task[];
  onToggle: (taskId: string) => void;
  onDelete: (taskId: string) => void;
  /** Where focus goes when the list empties. */
  onEmptyFocus: () => void;
}

export function TaskList({ open, done, onToggle, onDelete, onEmptyFocus }: Props) {
  const listRef = useRef<HTMLDivElement>(null);
  const nothing = open.length === 0 && done.length === 0;

  // Keep keyboard focus in the list after a delete removes the focused row.
  const deleteAndRefocus = (taskId: string) => {
    const ids = [...open, ...done].map((t) => t.id);
    const index = ids.indexOf(taskId);
    const neighbour = ids[index + 1] ?? ids[index - 1];
    onDelete(taskId);
    requestAnimationFrame(() => {
      const target = neighbour
        ? listRef.current?.querySelector<HTMLElement>(`#${CSS.escape(taskCheckboxId(neighbour))}`)
        : null;
      if (target) target.focus();
      else onEmptyFocus();
    });
  };

  if (nothing) {
    return (
      <div className="task-empty">
        <p className="task-empty__title">No tasks yet</p>
        <p className="task-empty__body">Type one above and press Enter.</p>
      </div>
    );
  }

  return (
    <div ref={listRef} className="task-lists">
      <section aria-labelledby="todo-heading">
        <h2 id="todo-heading" className="task-section__title">
          To do <span className="task-section__count">{open.length}</span>
        </h2>
        {open.length === 0 ? (
          <p className="task-section__empty">All done. Nice work.</p>
        ) : (
          <ul className="task-list">
            {open.map((task) => (
              <TaskItem key={task.id} task={task} onToggle={onToggle} onDelete={deleteAndRefocus} />
            ))}
          </ul>
        )}
      </section>
      {done.length > 0 && (
        <section aria-labelledby="done-heading">
          <h2 id="done-heading" className="task-section__title">
            Done <span className="task-section__count">{done.length}</span>
          </h2>
          <ul className="task-list">
            {done.map((task) => (
              <TaskItem key={task.id} task={task} onToggle={onToggle} onDelete={deleteAndRefocus} />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

interface ItemProps {
  task: Task;
  onToggle: (taskId: string) => void;
  onDelete: (taskId: string) => void;
}

function TaskItem({ task, onToggle, onDelete }: ItemProps) {
  const isDone = task.completedAt !== null;
  const id = taskCheckboxId(task.id);
  return (
    <li className={`task ${isDone ? 'task--done' : ''}`}>
      <input
        id={id}
        type="checkbox"
        className="task__checkbox"
        checked={isDone}
        onChange={() => onToggle(task.id)}
      />
      <label htmlFor={id} className="task__title">
        {task.title}
      </label>
      <button
        type="button"
        className="task__delete"
        aria-label={`Delete ${task.title}`}
        onClick={() => onDelete(task.id)}
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="none">
          <path
            d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </li>
  );
}
