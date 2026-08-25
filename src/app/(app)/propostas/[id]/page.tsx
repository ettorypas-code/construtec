import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FileDown, FileText } from "lucide-react";
import { requireUser } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { getProposal } from "@/lib/services/proposals";
import { listClientOptions } from "@/lib/services/clients";
import { listBudgetOptions } from "@/lib/services/budgets";
import { listServiceTypeOptions } from "@/lib/services/catalog";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/states";
import { StatRow } from "@/components/ui/stat";
import { ProposalForm } from "@/components/proposal/proposal-form";
import { ProposalItemRow, ProposalItemSheet } from "@/components/proposal/proposal-item-sheet";
import { CopyLinkButton, SendProposalButton } from "@/components/proposal/send-proposal";
import { formatBRL } from "@/lib/utils/money";
import { formatDate, formatDateTime } from "@/lib/utils/dates";
import { LeadStatus, ProposalStatus } from "@/domain/enums";
import { proposalStatusLabels, proposalStatusTones } from "@/domain/labels";
import { updateProposalAction } from "../actions";

export async function generateMetadata(props: PageProps<"/propostas/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  const proposal = await getProposal(id);
  return { title: proposal ? `${proposal.number} — ${proposal.title}` : "Proposta" };
}

export default async function ProposalDetailPage(props: PageProps<"/propostas/[id]">) {
  await requireUser();
  const { id } = await props.params;

  const [proposal, clientOptions, leads, serviceOptions, budgetOptions] = await Promise.all([
    getProposal(id),
    listClientOptions(),
    db.lead.findMany({
      where: { status: { not: LeadStatus.PERDIDO } },
      orderBy: { updatedAt: "desc" },
      select: { id: true, name: true },
    }),
    listServiceTypeOptions(),
    listBudgetOptions(),
  ]);

  if (!proposal) notFound();

  const status = proposal.status as ProposalStatus;
  const editable = status === ProposalStatus.RASCUNHO;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const publicUrl = proposal.publicToken ? `${appUrl}/p/${proposal.publicToken}` : null;

  return (
    <div className="space-y-5">
      <PageHeader
        title={proposal.title}
        backHref="/propostas"
        backLabel="Propostas"
        description={
          <span className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs text-ink-400">{proposal.number}</span>
            <Badge tone={proposalStatusTones[status]} dot>
              {proposalStatusLabels[status]}
            </Badge>
            {proposal.client ? (
              <Link
                href={`/clientes/${proposal.client.id}`}
                className="text-brand-600 hover:text-brand-700"
              >
                {proposal.client.name}
              </Link>
            ) : proposal.lead ? (
              <Link
                href={`/crm/${proposal.lead.id}`}
                className="text-brand-600 hover:text-brand-700"
              >
                {proposal.lead.name}
              </Link>
            ) : null}
          </span>
        }
        action={
          <a
            href={`/api/propostas/${proposal.id}/pdf`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-10 items-center gap-2 rounded-control border border-ink-200 bg-surface px-3.5 text-sm font-medium text-ink-700 transition-colors hover:bg-ink-50"
          >
            <FileDown className="size-4" />
            PDF
          </a>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_19rem]">
        <div className="space-y-4">
          <Card>
            <CardHeader
              title="Itens"
              description={editable ? undefined : "Proposta enviada — os itens estão travados."}
              action={editable ? <ProposalItemSheet proposalId={proposal.id} /> : undefined}
            />

            {proposal.items.length === 0 ? (
              <EmptyState
                icon={<FileText className="size-5" />}
                title="Nenhum item"
                description="Adicione os itens ou vincule um orçamento para importá-los."
              />
            ) : (
              <>
                <ul className="divide-y divide-ink-100">
                  {proposal.items.map((item) => (
                    <ProposalItemRow
                      key={item.id}
                      proposalId={proposal.id}
                      editable={editable}
                      item={{
                        id: item.id,
                        description: item.description,
                        detail: item.detail,
                        unit: item.unit,
                        quantity: item.quantity,
                        unitPriceCents: item.unitPriceCents,
                        totalCents: item.totalCents,
                      }}
                    />
                  ))}
                </ul>

                <div className="border-t border-ink-100 px-4 py-3 sm:px-5">
                  <StatRow label="Subtotal" value={formatBRL(proposal.subtotalCents)} />
                  {proposal.discountCents > 0 ? (
                    <StatRow
                      label="Desconto"
                      value={`− ${formatBRL(proposal.discountCents)}`}
                      tone="negative"
                    />
                  ) : null}
                  <div className="mt-2 flex items-baseline justify-between border-t border-ink-800 pt-2">
                    <span className="text-sm font-medium text-ink-800">Total</span>
                    <span className="text-lg font-semibold tabular text-brand-700">
                      {formatBRL(proposal.totalCents)}
                    </span>
                  </div>
                </div>
              </>
            )}
          </Card>

          <Card>
            <CardHeader title="Conteúdo da proposta" />
            <CardBody>
              <ProposalForm
                action={updateProposalAction}
                clientOptions={clientOptions}
                leadOptions={leads.map((lead) => ({ value: lead.id, label: lead.name }))}
                serviceOptions={serviceOptions}
                budgetOptions={budgetOptions}
                submitLabel="Salvar alterações"
                cancelHref="/propostas"
                defaults={{
                  id: proposal.id,
                  title: proposal.title,
                  clientId: proposal.clientId,
                  leadId: proposal.leadId,
                  serviceTypeId: proposal.serviceTypeId,
                  budgetId: proposal.budgetId,
                  scopeText: proposal.scopeText,
                  exclusionsText: proposal.exclusionsText,
                  deadlineText: proposal.deadlineText,
                  paymentTerms: proposal.paymentTerms,
                  notes: proposal.notes,
                  discountCents: proposal.discountCents,
                  validUntil: proposal.validUntil,
                }}
              />
            </CardBody>
          </Card>
        </div>

        <aside className="space-y-4">
          <Card>
            <CardHeader title="Envio" />
            <CardBody className="space-y-3">
              {status === ProposalStatus.RASCUNHO ? (
                <>
                  <p className="text-sm text-ink-500">
                    Ao enviar, o link público é liberado e o follow-up entra na sua lista de
                    tarefas automaticamente.
                  </p>
                  <SendProposalButton proposalId={proposal.id} />
                </>
              ) : publicUrl ? (
                <>
                  <p className="text-sm text-ink-500">
                    Link do cliente. Ele vê a proposta, baixa o PDF e responde por aqui.
                  </p>
                  <CopyLinkButton url={publicUrl} />
                </>
              ) : null}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Histórico" />
            <CardBody className="space-y-0.5">
              <StatRow label="Criada" value={formatDate(proposal.createdAt)} />
              <StatRow
                label="Enviada"
                value={proposal.sentAt ? formatDateTime(proposal.sentAt) : "—"}
              />
              <StatRow
                label="Visualizada"
                value={proposal.viewedAt ? formatDateTime(proposal.viewedAt) : "—"}
              />
              <StatRow
                label="Respondida"
                value={proposal.decidedAt ? formatDateTime(proposal.decidedAt) : "—"}
              />
              <StatRow
                label="Válida até"
                value={proposal.validUntil ? formatDate(proposal.validUntil) : "—"}
              />
            </CardBody>
          </Card>

          {proposal.budget ? (
            <Card>
              <CardHeader title="Orçamento de origem" />
              <CardBody>
                <Link
                  href={`/orcamentos/${proposal.budget.id}`}
                  className="text-sm font-medium text-brand-600 hover:text-brand-700"
                >
                  {proposal.budget.name}
                </Link>
                <p className="mt-0.5 text-sm tabular text-ink-500">
                  {formatBRL(proposal.budget.saleTotalCents)}
                </p>
              </CardBody>
            </Card>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
