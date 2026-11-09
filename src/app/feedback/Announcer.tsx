import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

type Announce = (message: string) => void;

const AnnouncerContext = createContext<Announce>(() => {});

/**
 * One polite live region for the whole app. Messages are queued briefly so
 * several events in one action (completed, level up, badge) are all read.
 */
export function AnnouncerProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState('');
  const pending = useRef<string[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const announce = useCallback<Announce>((text) => {
    pending.current.push(text);
    if (timer.current) clearTimeout(timer.current);
    // Clear first so the same text twice in a row is still announced.
    setMessage('');
    timer.current = setTimeout(() => {
      setMessage(pending.current.join(' '));
      pending.current = [];
    }, 50);
  }, []);

  const value = useMemo(() => announce, [announce]);

  return (
    <AnnouncerContext.Provider value={value}>
      {children}
      <div className="visually-hidden" role="status" aria-live="polite" aria-atomic="true">
        {message}
      </div>
    </AnnouncerContext.Provider>
  );
}

export function useAnnounce(): Announce {
  return useContext(AnnouncerContext);
}
