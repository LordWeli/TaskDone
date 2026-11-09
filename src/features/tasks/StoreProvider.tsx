import { createContext, useContext, useSyncExternalStore, type ReactNode } from 'react';
import type { StoreSnapshot, TaskStore } from './store';

const StoreContext = createContext<TaskStore | null>(null);

export function StoreProvider({ store, children }: { store: TaskStore; children: ReactNode }) {
  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

export function useStore(): TaskStore {
  const store = useContext(StoreContext);
  if (!store) throw new Error('useStore must be used inside <StoreProvider>');
  return store;
}

export function useSnapshot(): StoreSnapshot {
  const store = useStore();
  return useSyncExternalStore(store.subscribe, store.getSnapshot);
}
