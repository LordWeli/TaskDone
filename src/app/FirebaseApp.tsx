import { lazy, Suspense } from 'react';
import { LoginScreen } from '../features/auth/LoginScreen';
import { useAuth } from '../features/auth/useAuth';
import { firebaseAuth } from '../lib/firebase';

// Start fetching Firestore right away, in parallel with auth; sign-in never waits for it.
const syncedShell = import('./SyncedShell');
const SyncedShell = lazy(() => syncedShell);

/** Signed-in app backed by Firebase. Loaded as its own chunk. */
export default function FirebaseApp() {
  const { state, signIn, signUp, resetPassword, logOut } = useAuth(firebaseAuth());

  switch (state.status) {
    case 'loading':
      return <AppLoading />;
    case 'signedOut':
      return <LoginScreen onSignIn={signIn} onSignUp={signUp} onResetPassword={resetPassword} />;
    case 'signedIn':
      return (
        <Suspense fallback={<AppLoading />}>
          <SyncedShell
            key={state.user.uid}
            uid={state.user.uid}
            account={{ email: state.user.email ?? '', onSignOut: () => void logOut() }}
          />
        </Suspense>
      );
  }
}

function AppLoading() {
  return (
    <main className="app-loading" aria-busy="true">
      <p className="visually-hidden" role="status">
        Loading TaskDone
      </p>
    </main>
  );
}
