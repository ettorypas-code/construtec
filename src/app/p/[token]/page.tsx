import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CheckCircle2, Download, XCircle } from "lucide-react";
import { getProposalByToken, markProposalViewed } from "@/lib/services/proposals";
import { getCompanySettings } from "@/lib/services/catalog";
import { Logo } from "@/components/brand/logo";
import { formatBRL, formatQuantity } from "@/lib/utils/money";
import { formatDate } from "@/lib/utils/dates";
import { ProposalStatus } from "@/domain/enums";
import { unitLabels } from "@/domain/labels";
import type { Unit } from "@/domain/enums";
import { DecisionForm } from "./decision-form";

export const metadata: Metadata = {
  title: "Proposta",
  robots: { index: false, follow: false },
};

/**
 * Página pública da proposta.
 *
 * O cliente chega por um link com token, sem conta e provavelmente pelo
 * celular. Precisa entender o que está contratando, ver o preço e responder —
 * nada além disso.
 */
export default async function PublicProposalPage(props: PageProps<"/p/[token]">) {
  const { token } = await props.params;

  // Abrir o link já registra a visualização: é o sinal mais barato de que a
  // proposta chegou ao destinatário.
  await markProposalViewed(token);

  const [proposal, company] = await Promise.all([
    getProposalByToken(token),
    getCompanySettings(),
  ]);

  if (!proposal) notFound();

  const status = proposal.status as ProposalStatus;
  const clientName = proposal.client?.name ?? proposal.lead?.name ?? "Cliente";
  const decided = status === ProposalStatus.ACEITA || status === ProposalStatus.RECUSADA;
  const expired = status === ProposalStatus.EXPIRADA;

  return (
    <main className="min-h-dvh bg-paper px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto w-full max-w-2xl space-y-5">
        <header className="flex items-center justify-between gap-4">
          <Logo />
          <span className="font-mono text-xs text-ink-400">{proposal.number}</span>
        </header>

        <section className="rounded-card border border-ink-200 bg-surface p-5 shadow-subtle sm:p-7">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">
            Proposta comercial
          </p>
          <h1 className="mt-2 text-xl font-semibold tracking-tight text-ink-900 sm:text-2xl">
            {proposal.title}
          </h1>
          <p className="mt-1.5 text-sm text-ink-500">
            Para {clientName}
            {proposal.validUntil ? ` · válida até ${formatDate(proposal.validUntil)}` : ""}
          </p>

          {proposal.scopeText ? (
            <div className="mt-6">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-500">
                Escopo
              </h2>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-ink-700">
                {proposal.scopeText}
              </p>
            </div>
          ) : null}

          <div className="mt-6">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-500">Itens</h2>
            <ul className="mt-2 divide-y divide-ink-100 border-y border-ink-100">
              {proposal.items.map((item) => (
                <li key={item.id} className="flex items-start justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm text-ink-900">{item.description}</p>
                    <p className="mt-0.5 text-xs tabular text-ink-500">
                      {formatQuantity(item.quantity)} {unitLabels[item.unit as Unit] ?? item.unit} ×{" "}
                      {formatBRL(item.unitPriceCents)}
                      {item.detail ? ` · ${item.detail}` : ""}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-medium tabular text-ink-900">
                    {formatBRL(item.totalCents)}
                  </p>
                </li>
              ))}
            </ul>

            <div className="mt-3 space-y-1 text-sm">
              <div className="flex justify-between text-ink-500">
                <span>Subtotal</span>
                <span className="tabular">{formatBRL(proposal.subtotalCents)}</span>
              </div>
              {proposal.discountCents > 0 ? (
                <div className="flex justify-between text-ink-500">
                  <span>Desconto</span>
                  <span className="tabular">− {formatBRL(proposal.discountCents)}</span>
                </div>
              ) : null}
              <div className="flex items-baseline justify-between border-t border-ink-800 pt-2">
                <span className="font-medium text-ink-800">Total</span>
                <span className="text-2xl font-semibold tabular text-brand-700">
                  {formatBRL(proposal.totalCents)}
                </span>
              </div>
            </div>
          </div>

          {proposal.deadlineText ? (
            <Block title="Prazo" text={proposal.deadlineText} />
          ) : null}
          {proposal.paymentTerms ? (
            <Block title="Condições de pagamento" text={proposal.paymentTerms} />
          ) : null}
          {proposal.exclusionsText ? (
            <Block title="Não incluso" text={proposal.exclusionsText} />
          ) : null}
          {proposal.serviceType?.legalNotes ? (
            <Block title="Observação legal" text={proposal.serviceType.legalNotes} />
          ) : null}

          <a
            href={`/api/propostas/${proposal.id}/pdf?token=${token}`}
            target="_blank"
            rel="noreferrer"
            className="mt-6 inline-flex h-11 items-center gap-2 rounded-control border border-ink-200 bg-surface px-4 text-sm font-medium text-ink-700 transition-colors hover:bg-ink-50"
          >
            <Download className="size-4" />
            Baixar em PDF
          </a>
        </section>

        <section className="rounded-card border border-ink-200 bg-surface p-5 shadow-subtle sm:p-7">
          {decided ? (
            <div className="flex items-start gap-3">
              {status === ProposalStatus.ACEITA ? (
                <>
                  <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" />
                  <div>
                    <p className="font-medium text-ink-900">Proposta aceita</p>
                    <p className="mt-1 text-sm text-ink-500">
                      Obrigado. Entraremos em contato para combinar a execução.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <XCircle className="mt-0.5 size-5 shrink-0 text-ink-400" />
                  <div>
                    <p className="font-medium text-ink-900">Proposta recusada</p>
                    <p className="mt-1 text-sm text-ink-500">
                      Registramos sua resposta. Se mudar de ideia, é só entrar em contato.
                    </p>
                  </div>
                </>
              )}
            </div>
          ) : expired ? (
            <div>
              <p className="font-medium text-ink-900">Proposta expirada</p>
              <p className="mt-1 text-sm text-ink-500">
                O prazo de validade venceu. Entre em contato para receber uma proposta atualizada.
              </p>
            </div>
          ) : (
            <>
              <h2 className="text-sm font-medium text-ink-800">Sua resposta</h2>
              <p className="mb-4 mt-1 text-sm text-ink-500">
                Ao aceitar, iniciamos o agendamento do serviço.
              </p>
              <DecisionForm token={token} />
            </>
          )}
        </section>

        <footer className="pb-6 text-center text-xs text-ink-400">
          {[company.name, company.document, company.phone, company.email]
            .filter(Boolean)
            .join(" · ")}
        </footer>
      </div>
    </main>
  );
}

function Block({ title, text }: { title: string; text: string }) {
  return (
    <div className="mt-6">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-500">{title}</h2>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-ink-700">{text}</p>
    </div>
  );
}
