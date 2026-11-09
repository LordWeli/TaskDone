import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import './Toaster.css';

export interface ToastOptions {
  message: string;
  /** Toasts with an action stay until dismissed or replaced (WCAG 2.2.1). */
  action?: { label: string; onAction: () => void };
  /** ms before an action-less toast hides; paused while hovered or focused */
  duration?: number;
  tone?: 'neutral' | 'celebrate';
}

interface Toast extends ToastOptions {
  id: number;
}

const DEFAULT_DURATION = 6000;

interface ToastApi {
  show: (toast: ToastOptions) => void;
  /** Drop pending action toasts, e.g. when the user moves on to another action. */
  clearActions: () => void;
}

const ToastContext = createContext<ToastApi>({ show: () => {}, clearActions: () => {} });

/**
 * Snackbars. Screen-reader announcements go through the Announcer, so this
 * region is not live (avoids reading things twice).
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const show = useCallback((options: ToastOptions) => {
    const id = nextId.current++;
    setToasts((list) => {
      // Only one undo snackbar at a time; celebrations can stack (max 3).
      const kept = options.action ? list.filter((t) => !t.action) : list;
      return [...kept, { ...options, id }].slice(-3);
    });
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const clearActions = useCallback(() => {
    setToasts((list) => (list.some((t) => t.action) ? list.filter((t) => !t.action) : list));
  }, []);

  const value = useMemo(() => ({ show, clearActions }), [show, clearActions]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <section className="toaster" aria-label="Notifications">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={dismiss} />
        ))}
      </section>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: number) => void }) {
  const [paused, setPaused] = useState(false);
  const remaining = useRef(toast.duration ?? DEFAULT_DURATION);
  const startedAt = useRef(0);

  const persistent = toast.action !== undefined;

  useEffect(() => {
    if (paused || persistent) return;
    startedAt.current = Date.now();
    const timer = setTimeout(() => onDismiss(toast.id), remaining.current);
    return () => {
      clearTimeout(timer);
      remaining.current -= Date.now() - startedAt.current;
    };
  }, [paused, persistent, toast.id, onDismiss]);

  return (
    <div
      className={`toast toast--${toast.tone ?? 'neutral'}`}
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onDismiss(toast.id);
      }}
    >
      <p className="toast__message">{toast.message}</p>
      {toast.action && (
        <button
          type="button"
          className="toast__action"
          onClick={() => {
            toast.action?.onAction();
            onDismiss(toast.id);
          }}
        >
          {toast.action.label}
        </button>
      )}
      {persistent && (
        <button
          type="button"
          className="toast__dismiss"
          aria-label="Dismiss"
          onClick={() => onDismiss(toast.id)}
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18">
            <path
              d="M6 6l12 12M18 6L6 18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      )}
    </div>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
