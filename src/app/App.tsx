import { useState } from 'react';
import { createLocalStore } from '../features/tasks/localStore';
import { StoreProvider } from '../features/tasks/StoreProvider';
import type { TaskStore } from '../features/tasks/store';
import { Dashboard } from './Dashboard';
import { AnnouncerProvider } from './feedback/Announcer';
import { ToastProvider } from './feedback/Toaster';

export function App({ store }: { store?: TaskStore }) {
  const [activeStore] = useState(() => store ?? createLocalStore());
  return (
    <StoreProvider store={activeStore}>
      <AnnouncerProvider>
        <ToastProvider>
          <Dashboard />
        </ToastProvider>
      </AnnouncerProvider>
    </StoreProvider>
  );
}
