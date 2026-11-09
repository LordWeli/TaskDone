import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  type Auth,
  type User,
} from 'firebase/auth';
import { useCallback, useEffect, useState } from 'react';

export type AuthState =
  { status: 'loading' } | { status: 'signedOut' } | { status: 'signedIn'; user: User };

/**
 * Firebase email + password auth. The session persists on the device
 * (IndexedDB), works offline once signed in, and never leaves the app,
 * which matters for the iPhone Home Screen app.
 */
export function useAuth(auth: Auth) {
  const [state, setState] = useState<AuthState>({ status: 'loading' });

  useEffect(
    () =>
      onAuthStateChanged(auth, (user) =>
        setState(user ? { status: 'signedIn', user } : { status: 'signedOut' }),
      ),
    [auth],
  );

  const signIn = useCallback(
    async (email: string, password: string) => {
      await signInWithEmailAndPassword(auth, email, password);
    },
    [auth],
  );
  const signUp = useCallback(
    async (email: string, password: string) => {
      await createUserWithEmailAndPassword(auth, email, password);
    },
    [auth],
  );
  const resetPassword = useCallback((email: string) => sendPasswordResetEmail(auth, email), [auth]);
  const logOut = useCallback(() => signOut(auth), [auth]);

  return { state, signIn, signUp, resetPassword, logOut };
}
