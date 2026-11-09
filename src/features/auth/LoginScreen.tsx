import { useId, useState, type FormEvent } from 'react';
import { EMAIL_PATTERN, signInErrorMessage } from './messages';
import './LoginScreen.css';

interface Props {
  /** 'request' sends a link; 'confirm' finishes a link opened on another device. */
  mode: 'request' | 'confirm';
  onRequest: (email: string) => Promise<void>;
  onConfirm: (email: string) => Promise<void>;
}

export function LoginScreen({ mode, onRequest, onConfirm }: Props) {
  const [email, setEmail] = useState('');
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const inputId = useId();
  const errorId = useId();

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const value = email.trim();
    if (!EMAIL_PATTERN.test(value)) {
      setError('Enter an email like name@example.com.');
      return;
    }
    if (!navigator.onLine) {
      setError('You are offline. Connect to the internet to sign in.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      if (mode === 'confirm') await onConfirm(value);
      else {
        await onRequest(value);
        setSentTo(value);
      }
    } catch (e) {
      setError(signInErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

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

        {sentTo ? (
          <div className="login__sent" role="status">
            <h2 className="login__heading">Check your email</h2>
            <p className="login__text">
              We sent a sign-in link to <strong>{sentTo}</strong>. Open it on this device to
              continue.
            </p>
            <button type="button" className="login__secondary" onClick={() => setSentTo(null)}>
              Use a different email
            </button>
          </div>
        ) : (
          <form className="login__form" onSubmit={submit} noValidate>
            <h2 className="login__heading">
              {mode === 'confirm' ? 'Confirm your email' : 'Sign in to sync your tasks'}
            </h2>
            <p className="login__text">
              {mode === 'confirm'
                ? 'Enter the email you used to request this link.'
                : 'We will email you a link. No password needed.'}
            </p>
            <label htmlFor={inputId} className="login__label">
              Email
            </label>
            <input
              id={inputId}
              className="login__input"
              type="email"
              name="email"
              autoComplete="email"
              inputMode="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? errorId : undefined}
              autoFocus
            />
            {error && (
              <p id={errorId} className="login__error">
                {error}
              </p>
            )}
            <button type="submit" className="login__primary" aria-busy={busy || undefined}>
              {busy ? 'Sending…' : mode === 'confirm' ? 'Sign in' : 'Send sign-in link'}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
