import { cn } from "@/lib/utils/cn";

/**
 * Marca do Construtec.
 *
 * O símbolo é um nível de bolha visto de frente: o retângulo é o corpo, a linha
 * é o eixo de referência e o círculo é a bolha, deslocada do centro. Escolhido
 * porque a promessa do produto é exatamente essa — mostrar o que está fora do
 * esquadro antes que vire problema.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden
      className={cn("size-8", className)}
    >
      <rect
        x="1.25"
        y="7.25"
        width="29.5"
        height="17.5"
        rx="4.75"
        className="fill-brand-600"
      />
      <path
        d="M6 16h20"
        stroke="currentColor"
        strokeOpacity="0.45"
        strokeWidth="1.5"
        strokeLinecap="round"
        className="text-white"
      />
      <circle cx="12.5" cy="16" r="4" className="fill-white" />
      <path
        d="M22 12.5v7M25.5 12.5v7"
        stroke="currentColor"
        strokeOpacity="0.55"
        strokeWidth="1.5"
        strokeLinecap="round"
        className="text-white"
      />
    </svg>
  );
}

export function Logo({
  className,
  markClassName,
  showWordmark = true,
}: {
  className?: string;
  markClassName?: string;
  showWordmark?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark className={markClassName} />
      {showWordmark ? (
        <span className="text-[0.9375rem] font-semibold tracking-tight text-ink-900">
          Construtec
        </span>
      ) : null}
    </span>
  );
}
