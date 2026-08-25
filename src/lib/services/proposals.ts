import "server-only";

import { addDays } from "date-fns";
import { db } from "@/lib/db";
import { logActivity } from "@/lib/services/activity";
import { emit } from "@/lib/automation/engine";
import { BusinessError } from "@/lib/actions/result";
import { getCompanySettings } from "@/lib/services/catalog";
import { multiplyCents } from "@/lib/utils/money";
import { ProposalStatus } from "@/domain/enums";

async function nextProposalNumber(): Promise<string> {
  const settings = await getCompanySettings();
  const year = new Date().getFullYear();
  const sequence = settings.proposalNumberSequence;

  await db.companySettings.update({
    where: { id: settings.id },
    data: { proposalNumberSequence: sequence + 1 },
  });

  return `PRO-${year}-${String(sequence).padStart(4, "0")}`;
}

export async function listProposals(status?: string) {
  return db.proposal.findMany({
    where: status ? { status } : undefined,
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      number: true,
      title: true,
      status: true,
      totalCents: true,
      validUntil: true,
      sentAt: true,
      updatedAt: true,
      client: { select: { id: true, name: true } },
      lead: { select: { id: true, name: true } },
    },
  });
}

export async function getProposal(id: string) {
  return db.proposal.findUnique({
    where: { id },
    include: {
      client: true,
      lead: { select: { id: true, name: true, email: true, phone: true } },
      serviceType: true,
      budget: { select: { id: true, name: true, saleTotalCents: true } },
      items: { orderBy: { sortOrder: "asc" } },
    },
  });
}

export async function getProposalByToken(token: string) {
  return db.proposal.findUnique({
    where: { publicToken: token },
    include: {
      client: { select: { name: true } },
      lead: { select: { name: true } },
      items: { orderBy: { sortOrder: "asc" } },
      serviceType: { select: { name: true, legalNotes: true } },
    },
  });
}

type ProposalData = {
  title: string;
  clientId: string | null;
  leadId: string | null;
  serviceTypeId: string | null;
  budgetId: string | null;
  scopeText: string | null;
  exclusionsText: string | null;
  deadlineText: string | null;
  paymentTerms: string | null;
  notes: string | null;
  discountCents: number | null;
  validUntil: Date | null;
};

export async function createProposal(input: ProposalData, userId: string) {
  const settings = await getCompanySettings();
  const number = await nextProposalNumber();

  const proposal = await db.proposal.create({
    data: {
      ...input,
      number,
      discountCents: input.discountCents ?? 0,
      paymentTerms: input.paymentTerms ?? settings.defaultPaymentTerms,
      validUntil: input.validUntil ?? addDays(new Date(), settings.defaultValidityDays),
      status: ProposalStatus.RASCUNHO,
    },
  });

  // Proposta criada a partir de um orçamento nasce com os itens já preenchidos:
  // digitar duas vezes a mesma planilha é exatamente o trabalho que o sistema
  // existe para eliminar.
  if (input.budgetId) {
    await importBudgetItems(proposal.id, input.budgetId);
  }

  await recalculateProposal(proposal.id);

  await logActivity({
    userId,
    action: "proposal.created",
    summary: `Proposta criada: ${proposal.number}`,
    entityType: "Proposal",
    entityId: proposal.id,
  });

  return proposal;
}

export async function updateProposal(id: string, input: ProposalData, userId: string) {
  const existing = await db.proposal.findUnique({ where: { id } });
  if (!existing) throw new BusinessError("Proposta não encontrada.");

  await db.proposal.update({
    where: { id },
    data: { ...input, discountCents: input.discountCents ?? 0 },
  });

  // Vincular um orçamento depois da criação também traz os itens.
  if (input.budgetId && input.budgetId !== existing.budgetId) {
    await db.proposalItem.deleteMany({ where: { proposalId: id } });
    await importBudgetItems(id, input.budgetId);
  }

  const proposal = await recalculateProposal(id);

  await logActivity({
    userId,
    action: "proposal.updated",
    summary: `Proposta atualizada: ${proposal.number}`,
    entityType: "Proposal",
    entityId: id,
  });

  return proposal;
}

/**
 * Copia o orçamento para itens de proposta.
 *
 * O que vai para o cliente é o preço de venda; a composição de custo (material,
 * mão de obra, perdas, BDI) fica internamente no orçamento e nunca é exposta.
 */
async function importBudgetItems(proposalId: string, budgetId: string) {
  const items = await db.budgetItem.findMany({
    where: { budgetId },
    orderBy: [{ groupName: "asc" }, { sortOrder: "asc" }],
  });

  if (items.length === 0) return;

  await db.proposalItem.createMany({
    data: items.map((item, index) => ({
      proposalId,
      description: item.description,
      detail: item.groupName,
      unit: item.unit,
      quantity: item.quantity,
      unitPriceCents: item.unitSaleCents,
      totalCents: item.totalSaleCents,
      sortOrder: index,
    })),
  });
}

export async function addProposalItem(input: {
  proposalId: string;
  description: string;
  detail: string | null;
  unit: string;
  quantity: number;
  unitPriceCents: number;
}) {
  const last = await db.proposalItem.findFirst({
    where: { proposalId: input.proposalId },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });

  await db.proposalItem.create({
    data: {
      ...input,
      totalCents: multiplyCents(input.unitPriceCents, input.quantity),
      sortOrder: (last?.sortOrder ?? -1) + 1,
    },
  });

  return recalculateProposal(input.proposalId);
}

export async function updateProposalItem(
  id: string,
  input: {
    description: string;
    detail: string | null;
    unit: string;
    quantity: number;
    unitPriceCents: number;
  },
) {
  const item = await db.proposalItem.update({
    where: { id },
    data: { ...input, totalCents: multiplyCents(input.unitPriceCents, input.quantity) },
  });
  return recalculateProposal(item.proposalId);
}

export async function deleteProposalItem(id: string) {
  const item = await db.proposalItem.delete({ where: { id } });
  return recalculateProposal(item.proposalId);
}

export async function recalculateProposal(proposalId: string) {
  const proposal = await db.proposal.findUnique({
    where: { id: proposalId },
    include: { items: true },
  });
  if (!proposal) throw new BusinessError("Proposta não encontrada.");

  const subtotal = proposal.items.reduce((sum, item) => sum + item.totalCents, 0);
  const total = Math.max(0, subtotal - proposal.discountCents);

  return db.proposal.update({
    where: { id: proposalId },
    data: { subtotalCents: subtotal, totalCents: total },
  });
}

/* ------------------------------ Ciclo de vida ----------------------------- */

/** Envia: gera o token público, marca a data e dispara o follow-up automático. */
export async function sendProposal(id: string, userId: string) {
  const proposal = await db.proposal.findUnique({
    where: { id },
    include: { client: true, lead: true, items: true },
  });
  if (!proposal) throw new BusinessError("Proposta não encontrada.");
  if (proposal.items.length === 0) {
    throw new BusinessError("Adicione ao menos um item antes de enviar a proposta.");
  }

  const updated = await db.proposal.update({
    where: { id },
    data: {
      status: ProposalStatus.ENVIADA,
      sentAt: new Date(),
      publicToken: proposal.publicToken ?? crypto.randomUUID(),
    },
  });

  await logActivity({
    userId,
    action: "proposal.sent",
    summary: `Proposta enviada: ${updated.number}`,
    entityType: "Proposal",
    entityId: id,
  });

  await emit({
    type: "PROPOSTA_ENVIADA",
    proposalId: id,
    proposalNumber: updated.number,
    clientName: proposal.client?.name ?? proposal.lead?.name ?? "cliente",
  });

  return updated;
}

/** Registrada quando o cliente abre o link público. Só a primeira vez conta. */
export async function markProposalViewed(token: string) {
  const proposal = await db.proposal.findUnique({ where: { publicToken: token } });
  if (!proposal) return null;
  if (proposal.status !== ProposalStatus.ENVIADA) return proposal;

  return db.proposal.update({
    where: { id: proposal.id },
    data: { status: ProposalStatus.VISUALIZADA, viewedAt: new Date() },
  });
}

/**
 * Decisão do cliente pelo link público.
 *
 * Aceitar cria o recebimento previsto e converte o lead em cliente quando
 * ainda não existe — é o ponto em que a venda vira operação.
 */
export async function decideProposal(token: string, accepted: boolean) {
  const proposal = await db.proposal.findUnique({
    where: { publicToken: token },
    include: { client: true, lead: true },
  });
  if (!proposal) throw new BusinessError("Proposta não encontrada.");

  if (proposal.status === ProposalStatus.ACEITA || proposal.status === ProposalStatus.RECUSADA) {
    throw new BusinessError("Esta proposta já foi respondida.");
  }

  if (proposal.validUntil && proposal.validUntil < new Date()) {
    await db.proposal.update({
      where: { id: proposal.id },
      data: { status: ProposalStatus.EXPIRADA },
    });
    throw new BusinessError("Esta proposta expirou. Entre em contato para uma nova.");
  }

  const updated = await db.proposal.update({
    where: { id: proposal.id },
    data: {
      status: accepted ? ProposalStatus.ACEITA : ProposalStatus.RECUSADA,
      decidedAt: new Date(),
    },
  });

  await logActivity({
    action: accepted ? "proposal.accepted" : "proposal.declined",
    summary: `Proposta ${updated.number} ${accepted ? "aceita" : "recusada"} pelo cliente`,
    entityType: "Proposal",
    entityId: proposal.id,
  });

  if (!accepted) return updated;

  let clientId = proposal.clientId;

  if (!clientId && proposal.lead) {
    const client = await db.client.create({
      data: {
        kind: "PF",
        name: proposal.lead.name,
        email: proposal.lead.email,
        phone: proposal.lead.phone,
        whatsapp: proposal.lead.whatsapp,
        consentAt: proposal.lead.consentAt ?? new Date(),
      },
    });
    clientId = client.id;

    await db.lead.update({
      where: { id: proposal.lead.id },
      data: { clientId: client.id, status: "FECHADO" },
    });
    await db.proposal.update({ where: { id: proposal.id }, data: { clientId: client.id } });
  } else if (proposal.leadId) {
    await db.lead.update({ where: { id: proposal.leadId }, data: { status: "FECHADO" } });
  }

  await db.payment.create({
    data: {
      description: `${updated.number} — ${updated.title}`,
      clientId,
      proposalId: updated.id,
      amountCents: updated.totalCents,
      dueDate: addDays(new Date(), 7),
      status: "PREVISTO",
    },
  });

  await emit({
    type: "PROPOSTA_ACEITA",
    proposalId: updated.id,
    proposalNumber: updated.number,
    clientName: proposal.client?.name ?? proposal.lead?.name ?? "cliente",
  });

  return updated;
}

/**
 * Marca como expiradas as propostas cuja validade passou.
 *
 * Roda na abertura da lista de propostas — sem cron no MVP, o gatilho é o uso.
 */
export async function expireOverdueProposals(): Promise<number> {
  const result = await db.proposal.updateMany({
    where: {
      status: { in: [ProposalStatus.ENVIADA, ProposalStatus.VISUALIZADA] },
      validUntil: { lt: new Date() },
    },
    data: { status: ProposalStatus.EXPIRADA },
  });
  return result.count;
}
