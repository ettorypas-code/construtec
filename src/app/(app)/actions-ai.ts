"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { objectAction } from "@/lib/actions/action";
import { BusinessError } from "@/lib/actions/result";
import { requiredId } from "@/lib/validation/common";
import { markSuggestionAccepted, suggest } from "@/lib/services/ai";
import { enumField, optionalText } from "@/lib/validation/common";
import { FindingCategory, Severity } from "@/domain/enums";
import { leadStatusLabels } from "@/domain/labels";
import type { LeadStatus } from "@/domain/enums";
import { differenceInCalendarDays } from "date-fns";

/**
 * Ações da camada de IA.
 *
 * Todas devolvem rascunho. Nenhuma grava no domínio — quem grava é a ação do
 * módulo, depois que o profissional editou e confirmou.
 */

export const suggestFindingDescriptionAction = objectAction({
  schema: z.object({
    title: z.string().trim().min(1, "Descreva o problema antes de pedir sugestão"),
    roomName: optionalText(120),
    category: enumField(FindingCategory),
    severity: enumField(Severity),
    notes: optionalText(2000),
  }),
  handler: async (input, { user }) => {
    const result = await suggest(
      {
        kind: "REDIGIR_OCORRENCIA",
        title: input.title,
        roomName: input.roomName,
        category: input.category,
        severity: input.severity,
        notes: input.notes ?? "",
      },
      { userId: user.id, entityType: "Finding" },
    );

    if (!result.available) {
      throw new BusinessError("Sugestão automática indisponível no momento.");
    }

    return { interactionId: result.interactionId, text: result.text };
  },
});

export const suggestFollowUpAction = objectAction({
  schema: z.object({ leadId: requiredId }),
  handler: async ({ leadId }, { user }) => {
    const lead = await db.lead.findUnique({
      where: { id: leadId },
      include: {
        serviceType: { select: { name: true } },
        activities: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    });

    if (!lead) throw new BusinessError("Lead não encontrado.");

    const lastActivity = lead.activities[0] ?? null;

    const result = await suggest(
      {
        kind: "SUGERIR_FOLLOW_UP",
        leadName: lead.name,
        serviceName: lead.serviceType?.name ?? null,
        lastContact: lastActivity?.summary ?? null,
        daysSinceContact: lastActivity
          ? differenceInCalendarDays(new Date(), lastActivity.createdAt)
          : null,
        status: leadStatusLabels[lead.status as LeadStatus] ?? lead.status,
      },
      { userId: user.id, entityType: "Lead", entityId: lead.id },
    );

    if (!result.available) {
      throw new BusinessError("Sugestão automática indisponível no momento.");
    }

    return { interactionId: result.interactionId, text: result.text };
  },
});

export const suggestProposalScopeAction = objectAction({
  schema: z.object({ proposalId: requiredId, notes: optionalText(2000) }),
  handler: async ({ proposalId, notes }, { user }) => {
    const proposal = await db.proposal.findUnique({
      where: { id: proposalId },
      include: { serviceType: { select: { name: true, description: true } } },
    });

    if (!proposal) throw new BusinessError("Proposta não encontrada.");
    if (!proposal.serviceType) {
      throw new BusinessError("Vincule um serviço à proposta para gerar o escopo.");
    }

    const result = await suggest(
      {
        kind: "REDIGIR_ESCOPO",
        serviceName: proposal.serviceType.name,
        serviceDescription: proposal.serviceType.description,
        notes: notes ?? "",
      },
      { userId: user.id, entityType: "Proposal", entityId: proposal.id },
    );

    if (!result.available) {
      throw new BusinessError("Sugestão automática indisponível no momento.");
    }

    return { interactionId: result.interactionId, text: result.text };
  },
});

/** Registra que o profissional aproveitou o texto. Alimenta a auditoria de IA. */
export const acceptSuggestionAction = objectAction({
  schema: z.object({ interactionId: requiredId }),
  handler: async ({ interactionId }) => {
    await markSuggestionAccepted(interactionId);
    return { interactionId };
  },
});
