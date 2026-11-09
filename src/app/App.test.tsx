import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryStore } from '../features/tasks/localStore';
import { App } from './App';

function setup() {
  const store = createMemoryStore();
  const user = userEvent.setup();
  render(<App store={store} />);
  const input = screen.getByRole('textbox', { name: 'New task' });
  return { store, user, input };
}

describe('acceptance flows', () => {
  it('adds a task with Enter and keeps focus in the field', async () => {
    const { user, input } = setup();
    expect(screen.getByText('No tasks yet')).toBeInTheDocument();

    await user.type(input, 'Buy milk{Enter}');

    expect(screen.getByRole('checkbox', { name: 'Buy milk' })).not.toBeChecked();
    expect(input).toHaveValue('');
    expect(input).toHaveFocus();
    expect(screen.getByRole('progressbar', { name: "Today's progress" })).toHaveAttribute(
      'aria-valuetext',
      '0 of 1 tasks done',
    );
  });

  it('ignores a blank task', async () => {
    const { user, input, store } = setup();
    await user.type(input, '   {Enter}');
    expect(store.getSnapshot().tasks).toHaveLength(0);
  });

  it('shows newest open tasks first', async () => {
    const { user, input } = setup();
    await user.type(input, 'First{Enter}Second{Enter}');
    const todo = screen.getByRole('region', { name: /to do/i });
    const names = within(todo)
      .getAllByRole('listitem')
      .map((li) => li.textContent);
    expect(names).toEqual(['Second', 'First']);
  });

  it('completes a task with the checkbox and updates progress', async () => {
    const { user, input, store } = setup();
    await user.type(input, 'Buy milk{Enter}');

    await user.click(screen.getByRole('checkbox', { name: 'Buy milk' }));

    const done = screen.getByRole('region', { name: /done/i });
    expect(within(done).getByRole('checkbox', { name: 'Buy milk' })).toBeChecked();
    expect(screen.getByText('All done. Nice work.')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuetext', '1 of 1 tasks done');
    expect(store.getSnapshot().stats.totalXp).toBeGreaterThan(0);
  });

  it('toggles with Space on the keyboard', async () => {
    const { user, input } = setup();
    await user.type(input, 'Stretch{Enter}');
    screen.getByRole('checkbox', { name: 'Stretch' }).focus();
    await user.keyboard(' ');
    expect(screen.getByRole('checkbox', { name: 'Stretch' })).toBeChecked();
  });

  it('deletes a task and brings it back with Undo', async () => {
    const { user, input, store } = setup();
    await user.type(input, 'Buy milk{Enter}');

    await user.click(screen.getByRole('button', { name: 'Delete Buy milk' }));
    expect(screen.queryByRole('checkbox', { name: 'Buy milk' })).not.toBeInTheDocument();
    expect(screen.getByText('Task deleted')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Undo' }));
    expect(screen.getByRole('checkbox', { name: 'Buy milk' })).toBeInTheDocument();
    expect(store.getSnapshot().tasks).toHaveLength(1);
  });

  it('keeps the undo snackbar until dismissed or the next action', async () => {
    const { user, input } = setup();
    await user.type(input, 'One{Enter}Two{Enter}');
    await user.click(screen.getByRole('button', { name: 'Delete One' }));
    await user.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(screen.queryByText('Task deleted')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Delete Two' }));
    await user.type(input, 'Three{Enter}');
    expect(screen.queryByText('Task deleted')).not.toBeInTheDocument();
  });

  it('announces actions in the live region', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      const { user, input } = setup();
      await user.type(input, 'Buy milk{Enter}');
      act(() => {
        vi.advanceTimersByTime(100);
      });
      expect(screen.getByRole('status')).toHaveTextContent('Added Buy milk.');
    } finally {
      vi.useRealTimers();
    }
  });
});
