"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type ToastVariant = "success" | "error" | "info";

type ToastItem = {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
};

type ToastInput = {
  title: string;
  description?: string;
  variant?: ToastVariant;
  durationMs?: number;
};

type ToastContextValue = {
  toast: (input: ToastInput) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

function makeId() {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Array<ToastItem>>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    ({
      title,
      description,
      variant = "info",
      durationMs = 4500,
    }: ToastInput) => {
      const id = makeId();
      const item: ToastItem = { id, title, description, variant };
      setToasts((prev) => [...prev, item]);

      window.setTimeout(() => removeToast(id), durationMs);
    },
    [removeToast]
  );

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Toaster toasts={toasts} onDismiss={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

function Toaster({
  toasts,
  onDismiss,
}: {
  toasts: Array<ToastItem>;
  onDismiss: (id: string) => void;
}) {
  return (
    <div
      className="fixed bottom-6 left-6 z-50 flex w-full max-w-[380px] flex-col gap-3"
      aria-live="polite"
      aria-relevant="additions"
    >
      {toasts.map((t) => {
        const accentClass =
          t.variant === "success"
            ? "border-l-primary-green"
            : t.variant === "error"
            ? "border-l-destructive"
            : "border-l-primary-orange";

        return (
          <div
            key={t.id}
            className={`rounded-lg border border-gray-300 bg-white-100 px-4 py-3 shadow-xs border-l-4 ${accentClass}`}
            role="status"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-700 truncate">
                  {t.title}
                </p>
                {t.description && (
                  <p className="mt-1 text-sm text-gray-600 break-words">
                    {t.description}
                  </p>
                )}
              </div>

              <button
                type="button"
                className="text-gray-600 hover:text-gray-700 text-sm"
                onClick={() => onDismiss(t.id)}
                aria-label="Dismiss notification"
              >
                ✕
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
