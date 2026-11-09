import {
  isSignInWithEmailLink,
  sendSignInLinkToEmail,
  signInWithEmailLink,
  type Auth,
} from 'firebase/auth';

const EMAIL_KEY = 'taskdone:emailForSignIn';

function readEmail(): string | null {
  try {
    return localStorage.getItem(EMAIL_KEY);
  } catch {
    return null;
  }
}

function writeEmail(email: string | null) {
  try {
    if (email) localStorage.setItem(EMAIL_KEY, email);
    else localStorage.removeItem(EMAIL_KEY);
  } catch {
    // Storage blocked: the user will be asked for the email again.
  }
}

/** Sends the sign-in link and remembers the email for when the link is opened here. */
export async function sendLink(auth: Auth, email: string): Promise<void> {
  await sendSignInLinkToEmail(auth, email, {
    url: `${window.location.origin}/`,
    handleCodeInApp: true,
  });
  writeEmail(email);
}

/** True when the current URL is a sign-in link. */
export function isLinkInUrl(auth: Auth): boolean {
  return isSignInWithEmailLink(auth, window.location.href);
}

/** The email saved when the link was sent from this device, if any. */
export const savedEmail = readEmail;

/** Completes sign-in from the link in the URL, then strips the link from the address bar. */
export async function completeLink(auth: Auth, email: string): Promise<void> {
  await signInWithEmailLink(auth, email, window.location.href);
  writeEmail(null);
  window.history.replaceState(null, '', '/');
}
