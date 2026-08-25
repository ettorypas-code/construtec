import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  ClosingCta,
  FaqSection,
  Hero,
  IncludedSection,
  LegalNote,
  ProblemSection,
  StepsSection,
} from "@/components/marketing/sections";
import { findLanding, landings } from "@/content/landings";

/**
 * Landing de serviço.
 *
 * Uma rota dinâmica atende as quatro páginas — a diferença entre elas é
 * conteúdo, não estrutura. `generateStaticParams` fixa os slugs conhecidos;
 * qualquer outro cai em 404 em vez de renderizar uma página vazia.
 */
export function generateStaticParams() {
  return landings.map((landing) => ({ slug: landing.slug }));
}

export const dynamicParams = false;

export async function generateMetadata(props: PageProps<"/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const landing = findLanding(slug);
  if (!landing) return {};

  return {
    title: landing.seoTitle,
    description: landing.seoDescription,
    alternates: { canonical: `/${landing.slug}` },
    openGraph: {
      title: landing.seoTitle,
      description: landing.seoDescription,
      url: `/${landing.slug}`,
      type: "website",
      locale: "pt_BR",
    },
  };
}

export default async function LandingPage(props: PageProps<"/[slug]">) {
  const { slug } = await props.params;
  const landing = findLanding(slug);
  if (!landing) notFound();

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: landing.faq.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        // Conteúdo estático definido em content/landings.ts, sem entrada de usuário.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <Hero
        eyebrow={landing.eyebrow}
        title={landing.title}
        subtitle={landing.subtitle}
        serviceCode={landing.serviceCode}
        origin={landing.slug}
        formTitle={landing.formTitle}
        ctaLabel={landing.ctaLabel}
      />

      <ProblemSection
        title={landing.problemsTitle}
        intro={landing.problemsIntro}
        problems={landing.problems}
      />

      <StepsSection title={landing.stepsTitle} steps={landing.steps} />

      <IncludedSection
        title={landing.includedTitle}
        intro={landing.includedIntro}
        items={landing.included}
      />

      <FaqSection items={landing.faq} />

      <LegalNote text={landing.legalNote} />

      <ClosingCta
        title={landing.closingTitle}
        subtitle={landing.closingSubtitle}
        ctaLabel={landing.ctaLabel}
      />
    </>
  );
}
