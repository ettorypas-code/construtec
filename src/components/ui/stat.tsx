import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";

/**
 * Indicador numérico. Deliberadamente sem gráfico, sem ícone colorido e sem
 * variação percentual inventada — a tela do dashboard precisa ser lida em três
 * segundos, não decorada.
 */
export function Stat({
  label,
  value,
  hint,
  tone = "default",
  href,
  className,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: "default" | "positive" | "negative" | "muted";
  href?: string;
  className?: string;
}) {
  const valueTone = {
    default: "text-ink-900",
    positive: "text-success",
    negative: "text-danger",
    muted: "text-ink-500",
  }[tone];

  const content = (
    <>
      <p className="text-xs font-medium uppercase tracking-wide text-ink-500">{label}</p>
      <p className={cn("mt-1.5 text-2xl font-semibold tabular tracking-tight", valueTone)}>
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-ink-500">{hint}</p> : null}
    </>
  );

  const shell = cn(
    "rounded-card border border-ink-200 bg-surface px-4 py-3.5 shadow-subtle",
    href && "transition-colors hover:border-ink-300 hover:bg-ink-50",
    className,
  );

  return href ? (
    <Link href={href} className={cn(shell, "block")}>
      {content}
    </Link>
  ) : (
    <div className={shell}>{content}</div>
  );
}

/** Linha compacta rótulo → valor, para painéis densos e resumos. */
export function StatRow({
  label,
  value,
  tone = "default",
  className,
}: {
  label: ReactNode;
  value: ReactNode;
  tone?: "default" | "positive" | "negative" | "muted";
  className?: string;
}) {
  const valueTone = {
    default: "text-ink-900",
    positive: "text-success",
    negative: "text-danger",
    muted: "text-ink-500",
  }[tone];

  return (
    <div className={cn("flex items-baseline justify-between gap-4 py-1.5 text-sm", className)}>
      <span className="text-ink-500">{label}</span>
      <span className={cn("font-medium tabular", valueTone)}>{value}</span>
    </div>
  );
}
