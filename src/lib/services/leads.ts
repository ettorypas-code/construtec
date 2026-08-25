import "server-only";

import { db } from "@/lib/db";
import { emit } from "@/lib/automation/engine";
import { logActivity } from "@/lib/services/activity";
import { BusinessError } from "@/lib/actions/result";
import { removeStoredFiles } from "@/lib/storage";
import { LeadStatus, PIPELINE_STAGES, WON_STAGES, type LeadSource } from "@/domain/enums";
import { leadStatusLabels } from "@/domain/labels";
import type { LeadInput } from "@/lib/validation/crm";

export type PipelineLead = {
  id: string;
  name: string;
  status: string;
  potentialValueCents: number | null;
  serviceName: string | null;
  nextContactAt: Date | null;
  updatedAt: Date;
  phone: string | null;
  whatsapp: string | null;
};

export type PipelineColumn = {
  status: LeadStatus;
  label: string;
  leads: PipelineLead[];
  totalCents: number;
};

export type FunnelSummary = {
  newLeads: number;
  proposals: number;
  negotiations: number;
  won: number;
  lost: number;
  pipelineValueCents: number;
  conversionRate: number | null;
};

const leadListSelect = {
  id: true,
  name: true,
  status: true,
  potentialValueCents: true,
  nextContactAt: true,
  updatedAt: true,
  phone: true,
  whatsapp: true,
  serviceType: { select: { name: true } },
} as const;

export async function getPipeline(): Promise<PipelineColumn[]> {
  const leads = await db.lead.findMany({
    where: { status: { in: [...PIPELINE_STAGES] } },
    orderBy: [{ updatedAt: "desc" }],
    select: leadListSelect,
  });

  return PIPELINE_STAGES.map((status) => {
    const columnLeads = leads
      .filter((lead) => lead.status === status)
      .map((lead) => ({
        id: lead.id,
        name: lead.name,
        status: lead.status,
        potentialValueCents: lead.potentialValueCents,
        serviceName: lead.serviceType?.name ?? null,
        nextContactAt: lead.nextContactAt,
        updatedAt: lead.updatedAt,
        phone: lead.phone,
        whatsapp: lead.whatsapp,
      }));

    return {
      status,
      label: leadStatusLabels[status],
      leads: columnLeads,
      totalCents: columnLeads.reduce((sum, lead) => sum + (lead.potentialValueCents ?? 0), 0),
    };
  });
}

export async function getFunnelSummary(): Promise<FunnelSummary> {
  const [newLeads, proposals, negotiations, won, lost, total, pipeline] = await Promise.all([
    db.lead.count({ where: { status: LeadStatus.NOVO } }),
    db.lead.count({ where: { status: LeadStatus.ORCAMENTO_ENVIADO } }),
    db.lead.count({ where: { status: LeadStatus.NEGOCIACAO } }),
    db.lead.count({ where: { status: { in: [...WON_STAGES] } } }),
    db.lead.count({ where: { status: LeadStatus.PERDIDO } }),
    db.lead.count(),
    db.lead.aggregate({
      where: { status: { in: [...PIPELINE_STAGES] } },
      _sum: { potentialValueCents: true },
    }),
  ]);

  return {
    newLeads,
    proposals,
    negotiations,
    won,
    lost,
    pipelineValueCents: pipeline._sum.potentialValueCents ?? 0,
    conversionRate: total > 0 ? (won / total) * 100 : null,
  };
}

export async function getLostLeads() {
  return db.lead.findMany({
    where: { status: LeadStatus.PERDIDO },
    orderBy: { updatedAt: "desc" },
    take: 50,
    select: { ...leadListSelect, lostReason: true },
  });
}

export async function getLeadDetail(id: string) {
  return db.lead.findUnique({
    where: { id },
    include: {
      serviceType: { select: { id: true, name: true, code: true, legalNotes: true } },
      client: { select: { id: true, name: true } },
      activities: { orderBy: { createdAt: "desc" } },
      proposals: {
        orderBy: { createdAt: "desc" },
        select: { id: true, number: true, title: true, status: true, totalCents: true },
      },
    },
  });
}

export async function createLead(input: LeadInput, userId: string) {
  const lead = await db.lead.create({
    data: {
      name: input.name,
      phone: input.phone,
      whatsapp: input.whatsapp ?? input.phone,
      email: input.email,
      source: input.source,
      serviceTypeId: input.serviceTypeId,
      serviceNote: input.serviceNote,
      potentialValueCents: input.potentialValueCents,
      status: input.status,
      notes: input.notes,
      nextContactAt: input.nextContactAt,
    },
  });

  await logActivity({
    userId,
    action: "lead.created",
    summary: `Novo lead: ${lead.name}`,
    entityType: "Lead",
    entityId: lead.id,
  });

  await emit({ type: "LEAD_CRIADO", leadId: lead.id, leadName: lead.name });

  return lead;
}

/** Criação a partir do formulário público. Sem sessão, com consentimento LGPD. */
export async function createPublicLead(input: {
  name: string;
  phone: string;
  email: string | null;
  serviceCode: string | null;
  message: string | null;
  origin: string | null;
}) {
  const serviceType = input.serviceCode
    ? await db.serviceType.findUnique({ where: { code: input.serviceCode } })
    : null;

  const lead = await db.lead.create({
    data: {
      name: input.name,
      phone: input.phone,
      whatsapp: input.phone,
      email: input.email,
      source: "SITE" satisfies LeadSource,
      serviceTypeId: serviceType?.id ?? null,
      serviceNote: input.origin ? `Página: ${input.origin}` : null,
      potentialValueCents: serviceType?.basePriceCents ?? null,
      status: LeadStatus.NOVO,
      notes: input.message,
      consentAt: new Date(),
    },
  });

  await logActivity({
    action: "lead.created_public",
    summary: `Lead recebido pelo site: ${lead.name}`,
    entityType: "Lead",
    entityId: lead.id,
  });

  await emit({ type: "LEAD_CRIADO", leadId: lead.id, leadName: lead.name });

  return lead;
}

export async function updateLead(
  id: string,
  input: LeadInput & { lostReason?: string | null },
  userId: string,
) {
  const lead = await db.lead.update({
    where: { id },
    data: {
      name: input.name,
      phone: input.phone,
      whatsapp: input.whatsapp,
      email: input.email,
      source: input.source,
      serviceTypeId: input.serviceTypeId,
      serviceNote: input.serviceNote,
      potentialValueCents: input.potentialValueCents,
      status: input.status,
      notes: input.notes,
      nextContactAt: input.nextContactAt,
      lostReason: input.lostReason ?? null,
    },
  });

  await logActivity({
    userId,
    action: "lead.updated",
    summary: `Lead atualizado: ${lead.name}`,
    entityType: "Lead",
    entityId: lead.id,
  });

  return lead;
}

export async function changeLeadStatus(
  id: string,
  status: LeadStatus,
  lostReason: string | null,
  userId: string,
) {
  const lead = await db.lead.update({
    where: { id },
    data: {
      status,
      lostReason: status === LeadStatus.PERDIDO ? lostReason : null,
    },
  });

  await logActivity({
    userId,
    action: "lead.status_changed",
    summary: `${lead.name} → ${leadStatusLabels[status]}`,
    entityType: "Lead",
    entityId: lead.id,
  });

  return lead;
}

export async function addLeadActivity(
  input: {
    leadId: string;
    channel: string;
    summary: string;
    outcome: string | null;
    nextContactAt: Date | null;
  },
  userId: string,
) {
  const lead = await db.lead.findUnique({ where: { id: input.leadId } });
  if (!lead) throw new BusinessError("Lead não encontrado.");

  const activity = await db.leadActivity.create({
    data: {
      leadId: input.leadId,
      channel: input.channel,
      summary: input.summary,
      outcome: input.outcome,
    },
  });

  // Registrar contato move o lead de NOVO para CONTATO sozinho: o estágio é
  // consequência do que aconteceu, não mais uma coisa para lembrar de marcar.
  await db.lead.update({
    where: { id: input.leadId },
    data: {
      nextContactAt: input.nextContactAt,
      status: lead.status === LeadStatus.NOVO ? LeadStatus.CONTATO : lead.status,
    },
  });

  await logActivity({
    userId,
    action: "lead.contacted",
    summary: `Contato com ${lead.name}: ${input.summary}`,
    entityType: "Lead",
    entityId: lead.id,
  });

  return activity;
}

/** Converte o lead em cliente, reaproveitando os dados já coletados. */
export async function convertLeadToClient(
  input: {
    leadId: string;
    kind: string;
    document: string | null;
    addressLine: string | null;
    city: string | null;
    state: string | null;
  },
  userId: string,
) {
  const lead = await db.lead.findUnique({
    where: { id: input.leadId },
    include: { client: true },
  });

  if (!lead) throw new BusinessError("Lead não encontrado.");
  if (lead.clientId) throw new BusinessError("Este lead já foi convertido em cliente.");

  const client = await db.client.create({
    data: {
      kind: input.kind,
      name: lead.name,
      document: input.document,
      email: lead.email,
      phone: lead.phone,
      whatsapp: lead.whatsapp,
      addressLine: input.addressLine,
      city: input.city,
      state: input.state,
      consentAt: lead.consentAt ?? new Date(),
    },
  });

  await db.lead.update({
    where: { id: lead.id },
    data: {
      clientId: client.id,
      status: WON_STAGES.includes(lead.status as LeadStatus) ? lead.status : LeadStatus.FECHADO,
    },
  });

  await logActivity({
    userId,
    action: "lead.converted",
    summary: `${lead.name} virou cliente`,
    entityType: "Client",
    entityId: client.id,
  });

  return client;
}

/**
 * Apaga um lead.
 *
 * Cascade leva o histórico de contatos e os anexos; propostas ficam (o vínculo
 * vira nulo), porque uma proposta enviada é documento comercial e não some
 * junto com o cadastro que a originou. Os arquivos dos anexos precisam ser
 * removidos à mão — o banco não sabe do storage.
 */
export async function deleteLead(id: string, userId: string) {
  const attachments = await db.mediaAsset.findMany({
    where: { leadId: id },
    select: { storageKey: true },
  });

  const lead = await db.lead.delete({ where: { id } });

  // Task aponta por entityType/entityId, sem chave estrangeira — o cascade não
  // a alcança. Uma tarefa "Entrar em contato" com o lead apagado leva a lugar
  // nenhum: é lixo na lista do dia, e some junto.
  await db.task.deleteMany({ where: { entityType: "Lead", entityId: id } });

  await removeStoredFiles(attachments.map((asset) => asset.storageKey));

  await logActivity({
    userId,
    action: "lead.deleted",
    summary: `Lead removido: ${lead.name}`,
    entityType: "Lead",
    entityId: lead.id,
  });

  return { name: lead.name };
}
