"use client";

import { useEffect, useId, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/**
 * Painel modal. No celular sobe do rodapé ocupando a largura toda (com a alça
 * de arraste como affordance); no desktop vira um diálogo centralizado.
 *
 * É o mesmo componente nos dois casos de propósito: durante uma vistoria a
 * pessoa está de pé segurando o telefone, e mudar de padrão entre tamanhos de
 * tela só criaria dois comportamentos para manter.
 */
export function Sheet({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "md" | "lg";
}) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <div
        className="absolute inset-0 bg-ink-900/40 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          "relative flex max-h-[92dvh] w-full flex-col overflow-hidden bg-surface shadow-overlay",
          "rounded-t-2xl sm:rounded-card",
          size === "lg" ? "sm:max-w-2xl" : "sm:max-w-lg",
        )}
      >
        <div className="flex items-start justify-between gap-3 border-b border-ink-100 px-4 pb-3 pt-4 sm:px-5">
          <div className="min-w-0">
            <div
              className="mx-auto mb-3 h-1 w-9 rounded-full bg-ink-200 sm:hidden"
              aria-hidden
            />
            <h2 id={titleId} className="text-base font-semibold tracking-tight text-ink-900">
              {title}
            </h2>
            {description ? <p className="mt-0.5 text-sm text-ink-500">{description}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="-m-1.5 shrink-0 rounded-control p-1.5 text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-700"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-5">{children}</div>

        {footer ? (
          <div className="border-t border-ink-100 bg-paper px-4 py-3 pb-safe sm:px-5">{footer}</div>
        ) : null}
      </div>
    </div>
  );
}
