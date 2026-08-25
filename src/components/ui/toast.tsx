"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Check, Info, TriangleAlert, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type ToastTone = "success" | "error" | "info";
type Toast = { id: number; message: string; tone: ToastTone };

type ToastContextValue = {
  toast: (message: string, tone?: ToastTone) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const AUTO_DISMISS_MS = 4000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((item) => item.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, tone: ToastTone = "success") => {
      const id = Date.now() + Math.random();
      setToasts((current) => [...current, { id, message, tone }]);
      setTimeout(() => dismiss(id), AUTO_DISMISS_MS);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-20 z-60 flex flex-col items-center gap-2 px-4 sm:bottom-6 sm:right-6 sm:left-auto sm:items-end sm:px-0"
        role="region"
        aria-live="polite"
      >
        {toasts.map((item) => (
          <ToastCard key={item.id} toast={item} onDismiss={() => dismiss(item.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  // Fora do provider (ex.: componente renderizado numa página pública sem shell)
  // o toast vira no-op em vez de derrubar a árvore.
  return context ?? { toast: () => {} };
}

const toneStyles: Record<ToastTone, { wrapper: string; icon: ReactNode }> = {
  success: {
    wrapper: "border-success/25 bg-success-soft text-success",
    icon: <Check className="size-4" />,
  },
  error: {
    wrapper: "border-danger/25 bg-danger-soft text-danger",
    icon: <TriangleAlert className="size-4" />,
  },
  info: {
    wrapper: "border-ink-200 bg-surface text-ink-800",
    icon: <Info className="size-4" />,
  },
};

function ToastCard({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const style = toneStyles[toast.tone];
  return (
    <div
      className={cn(
        "pointer-events-auto flex w-full max-w-sm items-start gap-2.5 rounded-card border px-3.5 py-3 text-sm shadow-overlay",
        style.wrapper,
      )}
    >
      <span className="mt-0.5 shrink-0">{style.icon}</span>
      <p className="flex-1">{toast.message}</p>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Fechar aviso"
        className="-m-1 shrink-0 rounded p-1 opacity-60 transition-opacity hover:opacity-100"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
