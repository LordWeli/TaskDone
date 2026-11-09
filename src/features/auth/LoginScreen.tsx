import { useId, useState, type FormEvent } from 'react';
import { EMAIL_PATTERN, PASSWORD_MIN, authErrorMessage, type AuthField } from './messages';
import './LoginScreen.css';

interface Props {
  onSignIn: (email: string, password: string) => Promise<void>;
  onSignUp: (email: string, password: string) => Promise<void>;
  onResetPassword: (email: string) => Promise<void>;
}

type View = 'signIn' | 'signUp' | 'reset' | 'resetSent';

interface FieldError {
  field: AuthField;
  text: string;
}

const HEADINGS: Record<View, string> = {
  signIn: 'Sign in',
  signUp: 'Create your account',
  reset: 'Reset your password',
  resetSent: 'Check your email',
};

export function LoginScreen({ onSignIn, onSignUp, onResetPassword }: Props) {
  const [view, setView] = useState<View>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<FieldError | null>(null);
  const [busy, setBusy] = useState(false);
  const emailId = useId();
  const passwordId = useId();
  const hintId = useId();
  const errorId = useId();

  const go = (next: View) => {
    setError(null);
    setPassword('');
    setView(next);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const address = email.trim();
    if (!EMAIL_PATTERN.test(address)) {
      return setError({ field: 'email', text: 'Enter an email like name@example.com.' });
    }
    if (view !== 'reset' && password === '') {
      return setError({ field: 'password', text: 'Enter your password.' });
    }
    if (view === 'signUp' && password.length < PASSWORD_MIN) {
      return setError({ field: 'password', text: `Use at least ${PASSWORD_MIN} characters.` });
    }
    if (!navigator.onLine) {
      return setError({
        field: 'form',
        text: 'You are offline. Connect to the internet to sign in.',
      });
    }
    setBusy(true);
    setError(null);
    try {
      if (view === 'signIn') await onSignIn(address, password);
      else if (view === 'signUp') await onSignUp(address, password);
      else {
        await onResetPassword(address);
        setView('resetSent');
      }
    } catch (e) {
      setError(authErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  /** aria wiring for a field: its own error and, for the new password, the length hint. */
  const describe = (field: AuthField, extra?: string) => {
    const own = error?.field === field;
    const ids = [extra, own ? errorId : undefined].filter(Boolean).join(' ');
    return {
      ...(own ? { 'aria-invalid': true as const } : {}),
      ...(ids ? { 'aria-describedby': ids } : {}),
    };
  };

  const errorFor = (field: AuthField) =>
    error?.field === field ? (
      <p id={errorId} className="login__error" role={field === 'form' ? 'alert' : undefined}>
        {error.text}
      </p>
    ) : null;

  const primaryLabel = busy
    ? view === 'reset'
      ? 'Sending…'
      : 'Signing in…'
    : { signIn: 'Sign in', signUp: 'Create account', reset: 'Send reset link', resetSent: '' }[
        view
      ];

  return (
    <main className="login">
      <div className="login__card">
        <svg className="login__mark" aria-hidden="true" viewBox="0 0 64 64" width="56" height="56">
          <rect width="64" height="64" rx="14" fill="var(--color-accent)" />
          <path
            d="M18 33l9 9 19-20"
            fill="none"
            stroke="var(--color-text)"
            strokeWidth="7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <h1 className="login__title">TaskDone</h1>

        {view === 'resetSent' ? (
          <div className="login__form" role="status">
            <h2 className="login__heading">{HEADINGS.resetSent}</h2>
            <p className="login__text">
              We sent a reset link to <strong>{email.trim()}</strong>. If it is not in your inbox,
              look in spam. Choose a new password there, then come back and sign in.
            </p>
            <button type="button" className="login__secondary" onClick={() => go('signIn')}>
              Back to sign in
            </button>
          </div>
        ) : (
          <form className="login__form" onSubmit={submit} noValidate>
            <h2 className="login__heading">{HEADINGS[view]}</h2>
            <p className="login__text">
              {view === 'reset'
                ? 'We will email you a link to choose a new password.'
                : 'Your tasks sync across every device you sign in on.'}
            </p>

            <label htmlFor={emailId} className="login__label">
              Email
            </label>
            <input
              id={emailId}
              className="login__input"
              type="email"
              name="email"
              autoComplete={view === 'signUp' ? 'email' : 'username'}
              inputMode="email"
              autoCapitalize="none"
              spellCheck={false}
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              {...describe('email')}
            />
            {errorFor('email')}

            {view !== 'reset' && (
              <>
                <label htmlFor={passwordId} className="login__label">
                  Password
                </label>
                <div className="login__password">
                  <input
                    id={passwordId}
                    className="login__input"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    autoComplete={view === 'signUp' ? 'new-password' : 'current-password'}
                    autoCapitalize="none"
                    spellCheck={false}
                    minLength={view === 'signUp' ? PASSWORD_MIN : undefined}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    {...describe('password', view === 'signUp' ? hintId : undefined)}
                  />
                  <button
                    type="button"
                    className="login__reveal"
                    aria-pressed={showPassword}
                    onClick={() => setShowPassword((v) => !v)}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                    <span className="visually-hidden"> password</span>
                  </button>
                </div>
                {view === 'signUp' && (
                  <p id={hintId} className="login__hint">
                    Use at least {PASSWORD_MIN} characters.
                  </p>
                )}
                {errorFor('password')}
              </>
            )}

            {errorFor('form')}
            <button type="submit" className="login__primary" aria-busy={busy || undefined}>
              {primaryLabel}
            </button>

            <div className="login__links">
              {view === 'signIn' && (
                <>
                  <button type="button" className="login__link" onClick={() => go('reset')}>
                    Forgot password?
                  </button>
                  <button type="button" className="login__link" onClick={() => go('signUp')}>
                    Create an account
                  </button>
                </>
              )}
              {view !== 'signIn' && (
                <button type="button" className="login__link" onClick={() => go('signIn')}>
                  {view === 'signUp' ? 'I already have an account' : 'Back to sign in'}
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
