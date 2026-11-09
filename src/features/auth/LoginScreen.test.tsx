import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginScreen } from './LoginScreen';

type Credentials = (email: string, password: string) => Promise<void>;

function setup() {
  const onSignIn = vi.fn<Credentials>(() => Promise.resolve());
  const onSignUp = vi.fn<Credentials>(() => Promise.resolve());
  const onResetPassword = vi.fn<(email: string) => Promise<void>>(() => Promise.resolve());
  render(<LoginScreen onSignIn={onSignIn} onSignUp={onSignUp} onResetPassword={onResetPassword} />);
  return { user: userEvent.setup(), onSignIn, onSignUp, onResetPassword };
}

const email = () => screen.getByLabelText('Email');
const password = () => screen.getByLabelText('Password');

describe('LoginScreen', () => {
  it('signs in with email and password, using Enter', async () => {
    const { user, onSignIn } = setup();
    await user.type(email(), 'me@example.com');
    await user.type(password(), 'secret123{Enter}');
    expect(onSignIn).toHaveBeenCalledWith('me@example.com', 'secret123');
  });

  it('lets password managers fill the fields', () => {
    setup();
    expect(email()).toHaveAttribute('autocomplete', 'username');
    expect(password()).toHaveAttribute('autocomplete', 'current-password');
  });

  it('puts a wrong-password error on the password field', async () => {
    const { user, onSignIn } = setup();
    onSignIn.mockRejectedValueOnce({ code: 'auth/invalid-credential' });
    await user.type(email(), 'me@example.com');
    await user.type(password(), 'nope{Enter}');
    expect(password()).toHaveAttribute('aria-invalid', 'true');
    expect(password()).toHaveAccessibleDescription(/incorrect.*reset your password/);
  });

  it('validates the email before calling the server', async () => {
    const { user, onSignIn } = setup();
    await user.type(email(), 'me@');
    await user.type(password(), 'secret123{Enter}');
    expect(onSignIn).not.toHaveBeenCalled();
    expect(email()).toHaveAccessibleDescription('Enter an email like name@example.com.');
  });

  it('creates an account with a new password of the minimum length', async () => {
    const { user, onSignUp } = setup();
    await user.click(screen.getByRole('button', { name: 'Create an account' }));
    expect(password()).toHaveAttribute('autocomplete', 'new-password');
    expect(password()).toHaveAccessibleDescription('Use at least 8 characters.');
    await user.type(email(), 'me@example.com');
    await user.type(password(), 'short{Enter}');
    expect(onSignUp).not.toHaveBeenCalled();
    await user.clear(password());
    await user.type(password(), 'long enough{Enter}');
    expect(onSignUp).toHaveBeenCalledWith('me@example.com', 'long enough');
  });

  it('shows and hides the password', async () => {
    const { user } = setup();
    await user.click(screen.getByRole('button', { name: 'Show password' }));
    expect(password()).toHaveAttribute('type', 'text');
    await user.click(screen.getByRole('button', { name: 'Hide password' }));
    expect(password()).toHaveAttribute('type', 'password');
  });

  it('sends a reset link and says where it went', async () => {
    const { user, onResetPassword } = setup();
    await user.click(screen.getByRole('button', { name: 'Forgot password?' }));
    await user.type(email(), 'me@example.com{Enter}');
    expect(onResetPassword).toHaveBeenCalledWith('me@example.com');
    expect(screen.getByRole('heading', { name: 'Check your email' })).toBeInTheDocument();
  });
});
