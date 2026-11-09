import { StoreProvider } from '../features/tasks/StoreProvider';
import type { TaskStore } from '../features/tasks/store';
import { Dashboard, type Account } from './Dashboard';
import { AnnouncerProvider } from './feedback/Announcer';
import { ToastProvider } from './feedback/Toaster';

/** Providers around the dashboard, for any store. */
export function Shell({ store, account }: { store: TaskStore; account?: Account }) {
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
