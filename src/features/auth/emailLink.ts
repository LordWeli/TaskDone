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

/** True when `link` (for example pasted from the email) is a sign-in link. */
export function isSignInLink(auth: Auth, link: string): boolean {
  return isSignInWithEmailLink(auth, link.trim());
}

/** The email saved when the link was sent from this device, if any. */
export const savedEmail = readEmail;

/**
 * Completes sign-in from a link: the current URL by default, or a link pasted
 * into the app (an iPhone Home Screen app cannot receive links; iOS opens them
 * in Safari, which keeps separate storage).
 */
export async function completeLink(
  auth: Auth,
  email: string,
  link: string = window.location.href,
): Promise<void> {
  const fromUrl = link === window.location.href;
  await signInWithEmailLink(auth, email, link.trim());
  writeEmail(null);
  if (fromUrl) window.history.replaceState(null, '', '/');
}
