'use client';

/**
 * Imperative confirm-dialog system.
 *
 * Usage (in any hook or component):
 *   const confirm = useConfirm();
 *   const ok = await confirm({
 *     message: 'Move this post to trash?',
 *     confirmLabel: 'Move to trash',
 *     destructive: true,
 *   });
 *   if (!ok) return;
 *
 * Accepts a plain string as shorthand:
 *   const ok = await confirm('Delete this comment?');
 *
 * Mount <ConfirmProvider> once in Providers.tsx — it renders its own portal.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ConfirmOptions {
  message: string;
  /** Button label for the affirmative action. Defaults to 'Confirm'. */
  confirmLabel?: string;
  /** Button label for the negative action. Defaults to 'Cancel'. */
  cancelLabel?: string;
  /** When true the confirm button renders in red. Defaults to false. */
  destructive?: boolean;
}

export type ConfirmFn = (options: ConfirmOptions | string) => Promise<boolean>;

// ── Context ───────────────────────────────────────────────────────────────────

const ConfirmContext = createContext<ConfirmFn | null>(null);

export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used inside <ConfirmProvider>');
  return ctx;
}

// ── Internal dialog state ─────────────────────────────────────────────────────

interface DialogState {
  isOpen: boolean;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  destructive: boolean;
}

const CLOSED: DialogState = {
  isOpen: false,
  message: '',
  confirmLabel: 'Confirm',
  cancelLabel: 'Cancel',
  destructive: false,
};

// ── Provider ──────────────────────────────────────────────────────────────────

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [dialog, setDialog] = useState<DialogState>(CLOSED);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // The resolve fn for the current open Promise is stored in a ref so it is
  // not captured in any stale closure.
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const confirm: ConfirmFn = useCallback((optionsOrMessage) => {
    const opts: ConfirmOptions =
      typeof optionsOrMessage === 'string'
        ? { message: optionsOrMessage }
        : optionsOrMessage;

    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
      setDialog({
        isOpen: true,
        message: opts.message,
        confirmLabel: opts.confirmLabel ?? 'Confirm',
        cancelLabel:  opts.cancelLabel  ?? 'Cancel',
        destructive:  opts.destructive  ?? false,
      });
    });
  }, []);

  const close = useCallback((result: boolean) => {
    setDialog(CLOSED);
    resolveRef.current?.(result);
    resolveRef.current = null;
  }, []);

  // Close on Escape key
  useEffect(() => {
    if (!dialog.isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') close(false); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [dialog.isOpen, close]);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {mounted && dialog.isOpen &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-message"
            className="fixed inset-0 z-[9998] flex items-center justify-center p-4"
          >
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => close(false)}
              aria-hidden="true"
            />

            {/* Dialog panel */}
            <div className="confirm-dialog-enter relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm border border-gray-200 dark:border-gray-800 p-6">
              <p
                id="confirm-dialog-message"
                className="text-base font-semibold text-gray-900 dark:text-white leading-snug mb-6"
              >
                {dialog.message}
              </p>

              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => close(false)}
                  autoFocus
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-full hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  {dialog.cancelLabel}
                </button>
                <button
                  onClick={() => close(true)}
                  className={`px-4 py-2 text-sm font-medium text-white rounded-full transition-colors ${
                    dialog.destructive
                      ? 'bg-red-600 hover:bg-red-700 focus-visible:ring-red-500'
                      : 'bg-blue-600 hover:bg-blue-700 focus-visible:ring-blue-500'
                  } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2`}
                >
                  {dialog.confirmLabel}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </ConfirmContext.Provider>
  );
}
