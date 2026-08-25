import type { ReactNode } from "react";
import { Check, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { LeadForm } from "./lead-form";

/**
 * Blocos das landing pages.
 *
 * São compostos por dados (ver `content/landings.ts`), não duplicados por
 * página: quatro landings com a mesma estrutura e conteúdos diferentes não
 * justificam quatro arquivos de layout.
 */

export function Hero({
  eyebrow,
  title,
  subtitle,
  serviceCode,
  origin,
  formTitle,
  ctaLabel,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  serviceCode: string;
  origin: string;
  formTitle: string;
  ctaLabel: string;
}) {
  return (
    <section className="border-b border-ink-200 bg-surface">
      <div className="mx-auto grid max-w-5xl gap-10 px-5 py-12 sm:px-6 sm:py-16 lg:grid-cols-[1.1fr_1fr] lg:gap-14 lg:py-20">
        <div className="flex flex-col justify-center">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-600">
            {eyebrow}
          </p>
          <h1 className="mt-4 text-3xl font-semibold leading-[1.15] tracking-tight text-ink-900 sm:text-4xl lg:text-[2.75rem]">
            {title}
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-ink-600 sm:text-lg">
            {subtitle}
          </p>
          <a
            href="#agendar"
            className="mt-7 inline-flex h-12 w-fit items-center gap-2 rounded-control bg-brand-600 px-6 text-sm font-medium text-white transition-colors hover:bg-brand-700 lg:hidden"
          >
            {ctaLabel}
            <ChevronRight className="size-4" />
          </a>
        </div>

        <div
          id="agendar"
          className="scroll-mt-20 rounded-card border border-ink-200 bg-paper p-5 shadow-raised sm:p-6"
        >
          <h2 className="text-base font-semibold tracking-tight text-ink-900">{formTitle}</h2>
          <p className="mb-4 mt-1 text-sm text-ink-500">
            Resposta pelo WhatsApp, normalmente no mesmo dia.
          </p>
          <LeadForm serviceCode={serviceCode} origin={origin} submitLabel={ctaLabel} />
        </div>
      </div>
    </section>
  );
}

export function ProblemSection({
  title,
  intro,
  problems,
}: {
  title: string;
  intro?: string;
  problems: string[];
}) {
  return (
    <Section title={title} intro={intro}>
      <ul className="grid gap-3 sm:grid-cols-2">
        {problems.map((problem) => (
          <li
            key={problem}
            className="flex items-start gap-3 rounded-card border border-ink-200 bg-surface px-4 py-3.5"
          >
            <span
              aria-hidden
              className="mt-1.5 size-1.5 shrink-0 rounded-full bg-high"
            />
            <span className="text-sm leading-relaxed text-ink-700">{problem}</span>
          </li>
        ))}
      </ul>
    </Section>
  );
}

export function StepsSection({
  title,
  steps,
}: {
  title: string;
  steps: Array<{ title: string; description: string }>;
}) {
  return (
    <Section title={title}>
      <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {steps.map((step, index) => (
          <li
            key={step.title}
            className="rounded-card border border-ink-200 bg-surface px-4 py-4"
          >
            <span className="flex size-7 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-700">
              {index + 1}
            </span>
            <p className="mt-3 text-sm font-medium text-ink-900">{step.title}</p>
            <p className="mt-1 text-sm leading-relaxed text-ink-500">{step.description}</p>
          </li>
        ))}
      </ol>
    </Section>
  );
}

export function IncludedSection({
  title,
  intro,
  items,
}: {
  title: string;
  intro?: string;
  items: string[];
}) {
  return (
    <Section title={title} intro={intro}>
      <ul className="grid gap-2 sm:grid-cols-2">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2.5">
            <Check className="mt-0.5 size-4 shrink-0 text-brand-600" />
            <span className="text-sm leading-relaxed text-ink-700">{item}</span>
          </li>
        ))}
      </ul>
    </Section>
  );
}

export function FaqSection({
  title = "Perguntas frequentes",
  items,
}: {
  title?: string;
  items: Array<{ question: string; answer: string }>;
}) {
  return (
    <Section title={title}>
      <div className="divide-y divide-ink-200 overflow-hidden rounded-card border border-ink-200 bg-surface">
        {items.map((item) => (
          <details key={item.question} className="group">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-4 text-sm font-medium text-ink-900 sm:px-5">
              {item.question}
              <ChevronRight className="size-4 shrink-0 text-ink-400 transition-transform group-open:rotate-90" />
            </summary>
            <p className="px-4 pb-4 text-sm leading-relaxed text-ink-600 sm:px-5">
              {item.answer}
            </p>
          </details>
        ))}
      </div>
    </Section>
  );
}

export function LegalNote({ text }: { text: string }) {
  return (
    <div className="mx-auto max-w-5xl px-5 pb-12 sm:px-6">
      <p className="rounded-card border border-ink-200 bg-ink-50 px-4 py-3.5 text-xs leading-relaxed text-ink-500">
        {text}
      </p>
    </div>
  );
}

export function ClosingCta({
  title,
  subtitle,
  ctaLabel,
}: {
  title: string;
  subtitle: string;
  ctaLabel: string;
}) {
  return (
    <section className="border-t border-ink-200 bg-ink-900">
      <div className="mx-auto max-w-5xl px-5 py-14 text-center sm:px-6 sm:py-16">
        <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">{title}</h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-ink-300 sm:text-base">
          {subtitle}
        </p>
        <a
          href="#agendar"
          className="mt-7 inline-flex h-12 items-center gap-2 rounded-control bg-brand-500 px-7 text-sm font-medium text-white transition-colors hover:bg-brand-400"
        >
          {ctaLabel}
          <ChevronRight className="size-4" />
        </a>
      </div>
    </section>
  );
}

function Section({
  title,
  intro,
  children,
  className,
}: {
  title: string;
  intro?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("mx-auto max-w-5xl px-5 py-12 sm:px-6 sm:py-14", className)}>
      <h2 className="text-xl font-semibold tracking-tight text-ink-900 sm:text-2xl">{title}</h2>
      {intro ? (
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-600 sm:text-base">{intro}</p>
      ) : null}
      <div className="mt-6">{children}</div>
    </section>
  );
}
