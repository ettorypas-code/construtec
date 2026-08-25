import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Mail, MessageCircle, Phone, ScrollText } from "lucide-react";
import { requireUser } from "@/lib/auth/guards";
import { getLeadDetail } from "@/lib/services/leads";
import { listServiceTypeOptions } from "@/lib/services/catalog";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/states";
import { DeleteButton } from "@/components/ui/delete-button";
import { StatRow } from "@/components/ui/stat";
import { LeadForm } from "@/components/crm/lead-form";
import { LeadActivityForm } from "@/components/crm/lead-activity-form";
import { ConvertLeadSheet } from "@/components/crm/convert-lead-sheet";
import { FollowUpSuggestion } from "@/components/crm/follow-up-suggestion";
import { isAiEnabled } from "@/lib/ai/provider";
import { formatBRL } from "@/lib/utils/money";
import { formatDate, formatDateTime, relativeDayLabel } from "@/lib/utils/dates";
import {
  contactChannelLabels,
  leadSourceLabels,
  leadStatusLabels,
  leadStatusTones,
  proposalStatusLabels,
  proposalStatusTones,
} from "@/domain/labels";
import type {
  ContactChannel,
  LeadSource,
  LeadStatus,
  ProposalStatus,
} from "@/domain/enums";
import { deleteLeadAction, updateLeadAction } from "../actions";

export async function generateMetadata(props: PageProps<"/crm/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  const lead = await getLeadDetail(id);
  return { title: lead ? lead.name : "Lead" };
}

export default async function LeadDetailPage(props: PageProps<"/crm/[id]">) {
  await requireUser();
  const { id } = await props.params;

  const [lead, serviceOptions] = await Promise.all([
    getLeadDetail(id),
    listServiceTypeOptions(),
  ]);

  if (!lead) notFound();

  const status = lead.status as LeadStatus;
  const whatsappNumber = lead.whatsapp ?? lead.phone;

  return (
    <div className="space-y-5">
      <PageHeader
        title={lead.name}
        backHref="/crm"
        backLabel="Funil"
        description={
          <span className="flex flex-wrap items-center gap-2">
            <Badge tone={leadStatusTones[status]} dot>
              {leadStatusLabels[status]}
            </Badge>
            <span>Origem: {leadSourceLabels[lead.source as LeadSource] ?? lead.source}</span>
            {lead.client ? (
              <Link
                href={`/clientes/${lead.client.id}`}
                className="text-brand-600 hover:text-brand-700"
              >
                Cliente cadastrado
              </Link>
            ) : null}
          </span>
        }
        action={
          <>
            {lead.client ? (
              <ButtonLink href={`/propostas/nova?leadId=${lead.id}`} size="sm">
                Criar proposta
              </ButtonLink>
            ) : (
              <ConvertLeadSheet leadId={lead.id} leadName={lead.name} />
            )}

            <DeleteButton
              action={deleteLeadAction}
              id={lead.id}
              title="Excluir lead"
              entityLabel={lead.name}
              triggerLabel="Excluir lead"
              successMessage="Lead excluído."
              redirectTo="/crm"
              consequences={[
                `${lead.activities.length} registro(s) de contato no histórico`,
                "Os dados informados no formulário e o aceite de contato",
                "As tarefas abertas em cima deste lead",
              ]}
              warning={
                lead.proposals.length > 0
                  ? `As ${lead.proposals.length} proposta(s) enviadas continuam existindo — proposta é documento comercial e não some junto com o cadastro. Só perdem o vínculo com este lead.`
                  : lead.client
                    ? "O cliente já cadastrado a partir deste lead continua existindo. Só o registro do funil é apagado."
                    : undefined
              }
            />
          </>
        }
      />

      {/* Ações rápidas de contato: o que se usa de verdade no celular. */}
      <div className="flex flex-wrap gap-2">
        {whatsappNumber ? (
          <a
            href={`https://wa.me/55${whatsappNumber}`}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex h-10 items-center gap-2 rounded-control border border-ink-200 bg-surface px-3.5 text-sm font-medium text-ink-700 transition-colors hover:bg-ink-50"
          >
            <MessageCircle className="size-4 text-success" />
            WhatsApp
          </a>
        ) : null}
        {lead.phone ? (
          <a
            href={`tel:+55${lead.phone}`}
            className="inline-flex h-10 items-center gap-2 rounded-control border border-ink-200 bg-surface px-3.5 text-sm font-medium text-ink-700 transition-colors hover:bg-ink-50"
          >
            <Phone className="size-4 text-ink-400" />
            Ligar
          </a>
        ) : null}
        {lead.email ? (
          <a
            href={`mailto:${lead.email}`}
            className="inline-flex h-10 items-center gap-2 rounded-control border border-ink-200 bg-surface px-3.5 text-sm font-medium text-ink-700 transition-colors hover:bg-ink-50"
          >
            <Mail className="size-4 text-ink-400" />
            E-mail
          </a>
        ) : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-4">
          <Card>
            <CardHeader title="Registrar contato" />
            <CardBody className="space-y-4">
              <LeadActivityForm leadId={lead.id} />
              {isAiEnabled() ? (
                <div className="border-t border-ink-100 pt-4">
                  <FollowUpSuggestion leadId={lead.id} whatsappNumber={whatsappNumber} />
                </div>
              ) : null}
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Histórico"
              description={`${lead.activities.length} ${lead.activities.length === 1 ? "registro" : "registros"}`}
            />
            {lead.activities.length === 0 ? (
              <EmptyState
                icon={<ScrollText className="size-5" />}
                title="Nenhum contato registrado"
                description="Cada ligação ou mensagem registrada aqui vira histórico do relacionamento."
              />
            ) : (
              <ul className="divide-y divide-ink-100">
                {lead.activities.map((activity) => (
                  <li key={activity.id} className="px-4 py-3 sm:px-5">
                    <div className="flex items-baseline justify-between gap-3">
                      <Badge>
                        {contactChannelLabels[activity.channel as ContactChannel] ??
                          activity.channel}
                      </Badge>
                      <span className="text-xs text-ink-400">
                        {formatDateTime(activity.createdAt)}
                      </span>
                    </div>
                    <p className="mt-1.5 text-sm text-ink-700">{activity.summary}</p>
                    {activity.outcome ? (
                      <p className="mt-1 text-xs text-ink-500">{activity.outcome}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <CardHeader title="Dados do lead" />
            <CardBody>
              <LeadForm
                action={updateLeadAction}
                serviceOptions={serviceOptions}
                submitLabel="Salvar alterações"
                cancelHref="/crm"
                defaults={{
                  id: lead.id,
                  name: lead.name,
                  phone: lead.phone,
                  whatsapp: lead.whatsapp,
                  email: lead.email,
                  source: lead.source,
                  serviceTypeId: lead.serviceTypeId,
                  serviceNote: lead.serviceNote,
                  potentialValueCents: lead.potentialValueCents,
                  status: lead.status,
                  notes: lead.notes,
                  nextContactAt: lead.nextContactAt,
                  lostReason: lead.lostReason,
                }}
              />
            </CardBody>
          </Card>
        </div>

        <aside className="space-y-4">
          <Card>
            <CardHeader title="Resumo" />
            <CardBody className="space-y-0.5">
              <StatRow
                label="Valor potencial"
                value={lead.potentialValueCents ? formatBRL(lead.potentialValueCents) : "—"}
                tone={lead.potentialValueCents ? "positive" : "muted"}
              />
              <StatRow label="Serviço" value={lead.serviceType?.name ?? "Não definido"} />
              <StatRow
                label="Próximo contato"
                value={
                  lead.nextContactAt
                    ? `${formatDate(lead.nextContactAt)} (${relativeDayLabel(lead.nextContactAt)})`
                    : "—"
                }
              />
              <StatRow label="Criado em" value={formatDate(lead.createdAt)} />
            </CardBody>
          </Card>

          {lead.serviceType?.legalNotes ? (
            <Card className="border-warning/25 bg-warning-soft">
              <CardBody>
                <p className="text-xs font-semibold uppercase tracking-wide text-warning">
                  Observação legal do serviço
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-700">
                  {lead.serviceType.legalNotes}
                </p>
              </CardBody>
            </Card>
          ) : null}

          <Card>
            <CardHeader
              title="Propostas"
              action={
                <Link
                  href={`/propostas/nova?leadId=${lead.id}`}
                  className="text-sm font-medium text-brand-600 hover:text-brand-700"
                >
                  Nova
                </Link>
              }
            />
            {lead.proposals.length === 0 ? (
              <CardBody>
                <p className="text-sm text-ink-500">Nenhuma proposta enviada.</p>
              </CardBody>
            ) : (
              <ul className="divide-y divide-ink-100">
                {lead.proposals.map((proposal) => (
                  <li key={proposal.id}>
                    <Link
                      href={`/propostas/${proposal.id}`}
                      className="block px-4 py-3 transition-colors hover:bg-ink-50 sm:px-5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-medium text-ink-800">
                          {proposal.number}
                        </span>
                        <Badge tone={proposalStatusTones[proposal.status as ProposalStatus]}>
                          {proposalStatusLabels[proposal.status as ProposalStatus]}
                        </Badge>
                      </div>
                      <p className="mt-0.5 text-sm tabular text-ink-500">
                        {formatBRL(proposal.totalCents)}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {lead.notes ? (
            <Card>
              <CardHeader title="Anotações" />
              <CardBody>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink-700">
                  {lead.notes}
                </p>
              </CardBody>
            </Card>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
