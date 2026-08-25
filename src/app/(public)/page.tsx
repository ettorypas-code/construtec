import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import {
  ClosingCta,
  FaqSection,
  Hero,
  ProblemSection,
  StepsSection,
} from "@/components/marketing/sections";
import { LegalNote } from "@/components/marketing/sections";
import { landings } from "@/content/landings";
import { getCompanySettings } from "@/lib/services/catalog";

export const metadata: Metadata = {
  title: "Vistoria de entrega, orçamento e gestão de obra",
  description:
    "Vistoria de entrega de chaves, orçamento e quantitativo, fiscalização de reforma e " +
    "gerenciamento de obra para arquitetos. Experiência de canteiro aplicada ao seu imóvel.",
  alternates: { canonical: "/" },
};

/**
 * Home.
 *
 * A vistoria de entrega ocupa o topo porque é o serviço que converte mais
 * rápido e tem o ciclo de venda mais curto. Os outros aparecem logo abaixo,
 * cada um levando à sua própria landing.
 */
export default async function HomePage() {
  const primary = landings[0];
  const company = await getCompanySettings();

  return (
    <>
      <Hero
        eyebrow="Vistoria · Orçamento · Obra"
        title="Você comprou um imóvel novo? Não aceite as chaves sem saber o que está recebendo."
        subtitle={
          "Acompanho a entrega item por item e registro tudo o que está fora do padrão. " +
          "Você recebe um relatório organizado para exigir as correções da construtora."
        }
        serviceCode={primary.serviceCode}
        origin="home"
        formTitle="Agendar vistoria"
        ctaLabel="Agendar vistoria"
        whatsappNumber={company.whatsapp ?? company.phone}
      />

      <ProblemSection
        title="O que costuma dar errado"
        intro="A entrega é o único momento em que você tem força para exigir correção sem discussão."
        problems={primary.problems}
      />

      <StepsSection title="Como funciona" steps={primary.steps} />

      {/* Serviços ---------------------------------------------------------- */}
      <section className="mx-auto max-w-5xl px-5 py-12 sm:px-6 sm:py-14">
        <h2 className="text-xl font-semibold tracking-tight text-ink-900 sm:text-2xl">
          Serviços
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-600 sm:text-base">
          Da compra do imóvel à entrega da reforma.
        </p>

        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {landings.map((landing) => (
            <li key={landing.slug}>
              <Link
                href={`/${landing.slug}`}
                className="group flex h-full flex-col rounded-card border border-ink-200 bg-surface p-5 transition-colors hover:border-brand-300 hover:bg-brand-50/30"
              >
                <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">
                  {landing.eyebrow}
                </p>
                <p className="mt-2 text-base font-medium leading-snug text-ink-900">
                  {landing.seoTitle}
                </p>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-500">
                  {landing.seoDescription}
                </p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand-600">
                  Ver detalhes
                  <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Atendimento -------------------------------------------------------- */}
      <section className="border-y border-ink-200 bg-surface">
        <div className="mx-auto max-w-5xl px-5 py-12 sm:px-6 sm:py-14">
          <h2 className="text-xl font-semibold tracking-tight text-ink-900 sm:text-2xl">
            Como é o atendimento
          </h2>
          <ul className="mt-6 grid gap-6 sm:grid-cols-3">
            {[
              {
                title: "Direto comigo",
                description:
                  "Sem call center e sem intermediário. Quem responde no WhatsApp é quem vai ao imóvel.",
              },
              {
                title: "Preço fechado antes",
                description:
                  "Você sabe o valor antes de agendar. Sem surpresa depois do serviço executado.",
              },
              {
                title: "Documento organizado",
                description:
                  "Relatório em PDF com fotos, ambiente por ambiente, pronto para apresentar.",
              },
            ].map((item) => (
              <li key={item.title}>
                <p className="text-sm font-medium text-ink-900">{item.title}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-500">{item.description}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <FaqSection items={primary.faq} />

      <LegalNote text={primary.legalNote} />

      <ClosingCta
        title="A vistoria custa menos que o primeiro reparo"
        subtitle="Um vazamento não identificado na entrega vira obra depois — paga por você."
        ctaLabel="Agendar vistoria"
      />
    </>
  );
}
