import { useId, useState, type FormEvent, type RefObject } from 'react';
import { TASK_TITLE_MAX } from './model';
import './AddTaskForm.css';

/** Show the remaining-characters hint once this close to the limit. */
const COUNTER_THRESHOLD = 20;

interface Props {
  onAdd: (title: string) => boolean;
  inputRef: RefObject<HTMLInputElement | null>;
}

export function AddTaskForm({ onAdd, inputRef }: Props) {
  const [value, setValue] = useState('');
  const inputId = useId();
  const hintId = useId();
  const left = TASK_TITLE_MAX - value.length;
  const showCounter = left <= COUNTER_THRESHOLD;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (onAdd(value)) setValue('');
    inputRef.current?.focus();
  };

  return (
    <form className="add-task" onSubmit={submit}>
      <label htmlFor={inputId} className="visually-hidden">
        New task
      </label>
      <input
        ref={inputRef}
        id={inputId}
        className="add-task__input"
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Add a task, like Call the dentist"
        maxLength={TASK_TITLE_MAX}
        autoComplete="off"
        enterKeyHint="done"
        aria-describedby={showCounter ? hintId : undefined}
      />
      <button type="submit" className="add-task__button">
        <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20">
          <path
            d="M12 5v14M5 12h14"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
        <span>Add</span>
      </button>
      {showCounter && (
        <p id={hintId} className="add-task__hint">
          {left === 1 ? '1 character left' : `${left} characters left`}
        </p>
      )}
    </form>
  );
}
