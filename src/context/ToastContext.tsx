'use client';

/**
 * Global Toast notification system.
 *
 * Usage:
 *   const toast = useToast();
 *   toast.success('Post published!');
 *   toast.error('Failed to save.');
 *   toast.info('Autosaved.');
 *
 * Mount <ToastProvider> once in Providers.tsx — it renders its own portal.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

type ToastType = 'success' | 'error' | 'info';

interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
}

export interface ToastContextValue {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

// ── Context ───────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}

// ── Single Toast component ────────────────────────────────────────────────────

const TOAST_STYLES: Record<
  ToastType,
  { bg: string; text: string; icon: React.ReactNode }
> = {
  success: {
    bg:   'bg-green-50 dark:bg-green-950/70 border-green-200 dark:border-green-800',
    text: 'text-green-800 dark:text-green-200',
    icon: <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />,
  },
  error: {
    bg:   'bg-red-50 dark:bg-red-950/70 border-red-200 dark:border-red-800',
    text: 'text-red-800 dark:text-red-200',
    icon: <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />,
  },
  info: {
    bg:   'bg-blue-50 dark:bg-blue-950/70 border-blue-200 dark:border-blue-800',
    text: 'text-blue-800 dark:text-blue-200',
    icon: <Info className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />,
  },
};

const AUTO_DISMISS_MS = 4000;

function SingleToast({
  item,
  onRemove,
}: {
  item: ToastItem;
  onRemove: (id: string) => void;
}) {
  // Auto-dismiss
  useEffect(() => {
    const t = setTimeout(() => onRemove(item.id), AUTO_DISMISS_MS);
    return () => clearTimeout(t);
  }, [item.id, onRemove]);

  const { bg, text, icon } = TOAST_STYLES[item.type];

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`toast-enter flex items-start gap-3 w-full max-w-xs sm:max-w-sm px-4 py-3 rounded-xl border shadow-lg ${bg}`}
    >
      {icon}
      <p className={`flex-1 text-sm font-medium leading-snug ${text}`}>
        {item.message}
      </p>
      <button
        onClick={() => onRemove(item.id)}
        aria-label="Dismiss notification"
        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors flex-shrink-0"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  // Only render portal after mount to avoid SSR mismatch.
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const add = useCallback((type: ToastType, message: string) => {
    const id = Math.random().toString(36).slice(2, 9);
    // Keep at most 3 toasts visible at once — drop the oldest.
    setToasts((prev) => [...prev.slice(-2), { id, type, message }]);
  }, []);

  const value = useMemo<ToastContextValue>(
    () => ({
      success: (m) => add('success', m),
      error:   (m) => add('error', m),
      info:    (m) => add('info', m),
    }),
    [add],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      {mounted &&
        createPortal(
          <div
            aria-label="Notifications"
            className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none"
          >
            <div className="flex flex-col gap-2 items-end pointer-events-auto">
              {toasts.map((t) => (
                <SingleToast key={t.id} item={t} onRemove={remove} />
              ))}
            </div>
          </div>,
          document.body,
        )}
    </ToastContext.Provider>
  );
}
