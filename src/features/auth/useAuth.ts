import { onAuthStateChanged, signOut, type Auth, type User } from 'firebase/auth';
import { useCallback, useEffect, useState } from 'react';
import { completeLink, isLinkInUrl, isSignInLink, savedEmail, sendLink } from './emailLink';

export type AuthState =
  | { status: 'loading' }
  | { status: 'signedOut' }
  /** Opened a sign-in link on a device that did not request it: email needed. */
  | { status: 'needsEmail' }
  | { status: 'signedIn'; user: User };

/** Firebase auth state plus the email-link actions. Auth persists offline in IndexedDB. */
export function useAuth(auth: Auth) {
  // A link opened on a device that did not request it needs the email typed again.
  const [state, setState] = useState<AuthState>(() =>
    isLinkInUrl(auth) && !savedEmail() ? { status: 'needsEmail' } : { status: 'loading' },
  );

  useEffect(() => {
    let linkPending = isLinkInUrl(auth);
    const email = savedEmail();
    if (linkPending && email) {
      completeLink(auth, email).catch(() => {
        linkPending = false;
        setState({ status: 'signedOut' });
      });
    }
    return onAuthStateChanged(auth, (user) => {
      if (user) {
        linkPending = false;
        setState({ status: 'signedIn', user });
      } else if (!linkPending) {
        setState({ status: 'signedOut' });
      }
    });
  }, [auth]);

  const requestLink = useCallback((email: string) => sendLink(auth, email), [auth]);
  const confirmEmail = useCallback((email: string) => completeLink(auth, email), [auth]);
  const logOut = useCallback(() => signOut(auth), [auth]);
  const pasteLink = useCallback(
    async (email: string, link: string) => {
      if (!isSignInLink(auth, link)) throw { code: 'taskdone/not-a-link' };
      await completeLink(auth, email, link);
    },
    [auth],
  );

  return { state, requestLink, confirmEmail, pasteLink, savedEmail, logOut };
}
