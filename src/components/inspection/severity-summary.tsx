import { cn } from "@/lib/utils/cn";
import { SEVERITY_ORDER, type Severity } from "@/domain/enums";
import { severityLabels } from "@/domain/labels";

const styles: Record<Severity, string> = {
  CRITICA: "border-critical/25 bg-critical-soft text-critical",
  ALTA: "border-high/25 bg-high-soft text-high",
  MEDIA: "border-medium/25 bg-medium-soft text-medium",
  BAIXA: "border-low/20 bg-low-soft text-low",
};

/** Contagem por gravidade. Mesmo bloco na tela e na capa do relatório. */
export function SeveritySummary({
  tally,
  className,
}: {
  tally: Record<Severity, number>;
  className?: string;
}) {
  return (
    <ul className={cn("grid grid-cols-4 gap-2", className)}>
      {SEVERITY_ORDER.map((severity) => (
        <li
          key={severity}
          className={cn(
            "rounded-control border px-2 py-2 text-center",
            tally[severity] > 0 ? styles[severity] : "border-ink-200 bg-surface text-ink-400",
          )}
        >
          <p className="text-xl font-semibold tabular leading-none">{tally[severity]}</p>
          <p className="mt-1 text-[0.6875rem] font-medium uppercase tracking-wide">
            {severityLabels[severity]}
          </p>
        </li>
      ))}
    </ul>
  );
}
