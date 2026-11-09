import { useId, useState, type FormEvent } from 'react';
import { EMAIL_PATTERN, signInErrorMessage } from './messages';
import './LoginScreen.css';

interface Props {
  /** 'request' sends a link; 'confirm' finishes a link opened on another device. */
  mode: 'request' | 'confirm';
  onRequest: (email: string) => Promise<void>;
  onConfirm: (email: string) => Promise<void>;
  /** Finishes sign-in with a link pasted into the app. */
  onPasteLink: (email: string, link: string) => Promise<void>;
  /** Email remembered from an earlier request on this device. */
  rememberedEmail?: string | null;
}

type View = 'request' | 'sent' | 'paste';

/** Installed to the Home Screen: links from the email open in the browser, not here. */
function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  const iosStandalone = (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return iosStandalone || window.matchMedia?.('(display-mode: standalone)').matches === true;
}

const INVALID_EMAIL = 'Enter an email like name@example.com.';

export function LoginScreen({
  mode,
  onRequest,
  onConfirm,
  onPasteLink,
  rememberedEmail = null,
}: Props) {
  const [view, setView] = useState<View>('request');
  const [email, setEmail] = useState(rememberedEmail ?? '');
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [link, setLink] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [standalone] = useState(isStandalone);
  const emailId = useId();
  const linkId = useId();
  const errorId = useId();

  const run = async (action: () => Promise<void>) => {
    if (!navigator.onLine) {
      setError('You are offline. Connect to the internet to sign in.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await action();
    } catch (e) {
      setError(signInErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const submitEmail = (event: FormEvent) => {
    event.preventDefault();
    const value = email.trim();
    if (!EMAIL_PATTERN.test(value)) return setError(INVALID_EMAIL);
    void run(async () => {
      if (mode === 'confirm') return onConfirm(value);
      await onRequest(value);
      setSentTo(value);
      setView('sent');
    });
  };

  const submitLink = (event: FormEvent) => {
    event.preventDefault();
    const address = (sentTo ?? email).trim();
    if (!EMAIL_PATTERN.test(address)) return setError(INVALID_EMAIL);
    if (link.trim() === '') return setError('Paste the sign-in link from the email.');
    void run(() => onPasteLink(address, link));
  };

  const go = (next: View) => {
    setError(null);
    setView(next);
  };

  const errorProps = (field: 'email' | 'link') => {
    const fieldHasError =
      error !== null && (field === 'email' ? error === INVALID_EMAIL : error !== INVALID_EMAIL);
    return fieldHasError ? { 'aria-invalid': true, 'aria-describedby': errorId } : {};
  };

  const errorText = error && (
    <p id={errorId} className="login__error">
      {error}
    </p>
  );

  const emailField = (autoFocus: boolean) => (
    <>
      <label htmlFor={emailId} className="login__label">
        Email
      </label>
      <input
        id={emailId}
        className="login__input"
        type="email"
        name="email"
        autoComplete="email"
        inputMode="email"
        placeholder="name@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        autoFocus={autoFocus}
        {...errorProps('email')}
      />
    </>
  );

  const linkField = (autoFocus: boolean) => (
    <>
      <label htmlFor={linkId} className="login__label">
        Sign-in link
      </label>
      <input
        id={linkId}
        className="login__input"
        type="url"
        name="link"
        autoComplete="off"
        inputMode="url"
        placeholder="https://taskdone-wsn.firebaseapp.com/…"
        value={link}
        onChange={(e) => setLink(e.target.value)}
        autoFocus={autoFocus}
        {...errorProps('link')}
      />
    </>
  );

  const copyHint = standalone
    ? 'Links from the email open in Safari, not in this app. In the email, touch and hold the link, tap Copy Link, then paste it here.'
    : 'Open the link on this device, or copy it from the email and paste it here.';

  let body;
  if (mode === 'confirm') {
    body = (
      <form className="login__form" onSubmit={submitEmail} noValidate>
        <h2 className="login__heading">Confirm your email</h2>
        <p className="login__text">Enter the email you used to request this link.</p>
        {emailField(true)}
        {errorText}
        <button type="submit" className="login__primary" aria-busy={busy || undefined}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    );
  } else if (view === 'sent') {
    body = (
      <form className="login__form" onSubmit={submitLink} noValidate>
        <h2 className="login__heading">Check your email</h2>
        <p className="login__text" role="status">
          We sent a sign-in link to <strong>{sentTo}</strong>. If it is not in your inbox, look in
          spam.
        </p>
        <p className="login__text">{copyHint}</p>
        {linkField(true)}
        {errorText}
        <button type="submit" className="login__primary" aria-busy={busy || undefined}>
          {busy ? 'Signing in…' : 'Sign in with link'}
        </button>
        <button type="button" className="login__secondary" onClick={() => go('request')}>
          Use a different email
        </button>
      </form>
    );
  } else if (view === 'paste') {
    body = (
      <form className="login__form" onSubmit={submitLink} noValidate>
        <h2 className="login__heading">Paste your sign-in link</h2>
        <p className="login__text">{copyHint}</p>
        {emailField(!email)}
        {linkField(Boolean(email))}
        {errorText}
        <button type="submit" className="login__primary" aria-busy={busy || undefined}>
          {busy ? 'Signing in…' : 'Sign in with link'}
        </button>
        <button type="button" className="login__secondary" onClick={() => go('request')}>
          Back
        </button>
      </form>
    );
  } else {
    body = (
      <form className="login__form" onSubmit={submitEmail} noValidate>
        <h2 className="login__heading">Sign in to sync your tasks</h2>
        <p className="login__text">We will email you a link. No password needed.</p>
        {emailField(true)}
        {errorText}
        <button type="submit" className="login__primary" aria-busy={busy || undefined}>
          {busy ? 'Sending…' : 'Send sign-in link'}
        </button>
        <button type="button" className="login__secondary" onClick={() => go('paste')}>
          I already have a link
        </button>
      </form>
    );
  }

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
        {body}
      </div>
    </main>
  );
}
