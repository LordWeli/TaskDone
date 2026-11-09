import { useMemo, useState } from 'react';
import { LoginScreen } from '../features/auth/LoginScreen';
import { useAuth } from '../features/auth/useAuth';
import { createFirestoreStore } from '../features/tasks/firestoreStore';
import { createLocalStore } from '../features/tasks/localStore';
import { StoreProvider } from '../features/tasks/StoreProvider';
import type { TaskStore } from '../features/tasks/store';
import { getFirebase, isFirebaseConfigured } from '../lib/firebase';
import { Dashboard, type Account } from './Dashboard';
import { AnnouncerProvider } from './feedback/Announcer';
import { ToastProvider } from './feedback/Toaster';

function Shell({ store, account }: { store: TaskStore; account?: Account }) {
  return (
    <StoreProvider store={store}>
      <AnnouncerProvider>
        <ToastProvider>
          <Dashboard {...(account ? { account } : {})} />
        </ToastProvider>
      </AnnouncerProvider>
    </StoreProvider>
  );
}

/** Without Firebase config (or with an injected store, as in tests) the app runs on local storage. */
function LocalApp({ store }: { store?: TaskStore | undefined }) {
  const [activeStore] = useState(() => store ?? createLocalStore());
  return <Shell store={activeStore} />;
}

function SyncedDashboard({ uid, account }: { uid: string; account: Account }) {
  const store = useMemo(() => createFirestoreStore(getFirebase().db, uid), [uid]);
  return <Shell store={store} account={account} />;
}

function FirebaseApp() {
  const { auth } = getFirebase();
  const { state, signIn, signUp, resetPassword, logOut } = useAuth(auth);

  switch (state.status) {
    case 'loading':
      return (
        <main className="visually-hidden" aria-busy="true">
          Loading
        </main>
      );
    case 'signedOut':
      return <LoginScreen onSignIn={signIn} onSignUp={signUp} onResetPassword={resetPassword} />;
    case 'signedIn':
      return (
        <SyncedDashboard
          key={state.user.uid}
          uid={state.user.uid}
          account={{ email: state.user.email ?? '', onSignOut: () => void logOut() }}
        />
      );
  }
}

export function App({ store }: { store?: TaskStore }) {
  if (store || !isFirebaseConfigured) return <LocalApp store={store} />;
  return <FirebaseApp />;
}
