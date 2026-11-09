import { lazy, Suspense, useState } from 'react';
import { createLocalStore } from '../features/tasks/localStore';
import type { TaskStore } from '../features/tasks/store';
import { isFirebaseConfigured } from '../lib/firebaseConfig';
import { Shell } from './Shell';

const FirebaseApp = lazy(() => import('./FirebaseApp'));

/** Without Firebase config (or with an injected store, as in tests) the app runs on local storage. */
function LocalApp({ store }: { store?: TaskStore | undefined }) {
  const [activeStore] = useState(() => store ?? createLocalStore());
  return <Shell store={activeStore} />;
}

export function App({ store }: { store?: TaskStore }) {
  if (store || !isFirebaseConfigured) return <LocalApp store={store} />;
  return (
    <Suspense fallback={<main className="app-loading" aria-busy="true" />}>
      <FirebaseApp />
    </Suspense>
  );
}
