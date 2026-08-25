import "server-only";

import { db } from "@/lib/db";
import { complete, isAiEnabled } from "@/lib/ai/provider";
import { buildPrompt, summarizeInput, type SuggestionInput } from "@/lib/ai/prompts";

/**
 * Camada de sugestão por IA.
 *
 * Toda chamada é registrada em `AIInteraction` — inclusive as que falham. Três
 * motivos: custo (saber quanto foi gasto e em quê), auditoria (o que a IA
 * escreveu antes de alguém aceitar) e a regra de produto de que nenhuma saída
 * entra no domínio sem aceite explícito do profissional.
 *
 * `acceptedByUser` começa falso e só vira verdadeiro quando o usuário salva o
 * texto sugerido — é isso que separa "a IA propôs" de "o profissional validou".
 */

export type SuggestionResult =
  | { available: false }
  | { available: true; interactionId: string; text: string };

const DISABLED: SuggestionResult = { available: false };

export async function suggest(
  input: SuggestionInput,
  context: { userId: string; entityType?: string; entityId?: string },
): Promise<SuggestionResult> {
  if (!isAiEnabled()) return DISABLED;

  const inputSummary = summarizeInput(input);

  try {
    const result = await complete(buildPrompt(input));

    const interaction = await db.aIInteraction.create({
      data: {
        userId: context.userId,
        kind: input.kind,
        model: result.model,
        inputSummary,
        output: result.text,
        promptTokens: result.promptTokens,
        completionTokens: result.completionTokens,
        entityType: context.entityType ?? null,
        entityId: context.entityId ?? null,
      },
    });

    return { available: true, interactionId: interaction.id, text: result.text };
  } catch (error) {
    await db.aIInteraction.create({
      data: {
        userId: context.userId,
        kind: input.kind,
        inputSummary,
        errorMessage: error instanceof Error ? error.message : "Falha desconhecida",
        entityType: context.entityType ?? null,
        entityId: context.entityId ?? null,
      },
    });

    // Falha de IA nunca interrompe o trabalho: a UI apenas não mostra sugestão.
    console.error("[ai] falha ao gerar sugestão", error);
    return DISABLED;
  }
}

/** Marca que o profissional aceitou o texto sugerido. */
export async function markSuggestionAccepted(interactionId: string): Promise<void> {
  await db.aIInteraction.update({
    where: { id: interactionId },
    data: { acceptedByUser: true },
  });
}

export type AIUsageSummary = {
  totalCalls: number;
  acceptedCalls: number;
  failedCalls: number;
  promptTokens: number;
  completionTokens: number;
};

export async function getAiUsage(): Promise<AIUsageSummary> {
  const [totals, accepted, failed, tokens] = await Promise.all([
    db.aIInteraction.count(),
    db.aIInteraction.count({ where: { acceptedByUser: true } }),
    db.aIInteraction.count({ where: { errorMessage: { not: null } } }),
    db.aIInteraction.aggregate({
      _sum: { promptTokens: true, completionTokens: true },
    }),
  ]);

  return {
    totalCalls: totals,
    acceptedCalls: accepted,
    failedCalls: failed,
    promptTokens: tokens._sum.promptTokens ?? 0,
    completionTokens: tokens._sum.completionTokens ?? 0,
  };
}
