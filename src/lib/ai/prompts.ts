import type { AIInteractionKind } from "@/domain/enums";
import { severityLabels } from "@/domain/labels";
import type { Severity } from "@/domain/enums";

/**
 * Prompts por tipo de sugestão.
 *
 * Ficam separados do adaptador para poderem ser lidos e ajustados sem tocar em
 * código de infraestrutura — e para deixar explícito, em um lugar só, tudo que
 * o sistema pede à IA.
 */

export type SuggestionInput =
  | {
      kind: Extract<AIInteractionKind, "REDIGIR_OCORRENCIA">;
      title: string;
      roomName: string | null;
      category: string;
      severity: string;
      notes: string;
    }
  | {
      kind: Extract<AIInteractionKind, "SUGERIR_FOLLOW_UP">;
      leadName: string;
      serviceName: string | null;
      lastContact: string | null;
      daysSinceContact: number | null;
      status: string;
    }
  | {
      kind: Extract<AIInteractionKind, "REDIGIR_ESCOPO">;
      serviceName: string;
      serviceDescription: string | null;
      notes: string;
    };

export function buildPrompt(input: SuggestionInput): string {
  switch (input.kind) {
    case "REDIGIR_OCORRENCIA":
      return [
        "Reescreva a anotação abaixo como a descrição de uma não conformidade para um relatório de vistoria.",
        "",
        `Ambiente: ${input.roomName ?? "não informado"}`,
        `Categoria: ${input.category}`,
        `Gravidade classificada: ${severityLabels[input.severity as Severity] ?? input.severity}`,
        `Problema: ${input.title}`,
        `Anotação do vistoriador: ${input.notes || "(sem anotação)"}`,
        "",
        "Produza um único parágrafo de no máximo 3 frases, descrevendo apenas o que é observável.",
        "Não afirme causa, não indique responsável e não sugira solução.",
      ].join("\n");

    case "SUGERIR_FOLLOW_UP":
      return [
        "Escreva uma mensagem curta de WhatsApp para retomar contato com um cliente em potencial.",
        "",
        `Nome: ${input.leadName}`,
        `Serviço de interesse: ${input.serviceName ?? "ainda não definido"}`,
        `Estágio atual: ${input.status}`,
        `Último contato: ${input.lastContact ?? "nenhum registrado"}`,
        input.daysSinceContact !== null
          ? `Dias desde o último contato: ${input.daysSinceContact}`
          : "",
        "",
        "No máximo 3 frases. Tom cordial e direto, sem 'espero que esteja bem'.",
        "Termine com uma pergunta objetiva que facilite a resposta.",
      ]
        .filter(Boolean)
        .join("\n");

    case "REDIGIR_ESCOPO":
      return [
        "Escreva o texto de escopo de uma proposta comercial.",
        "",
        `Serviço: ${input.serviceName}`,
        `Descrição do catálogo: ${input.serviceDescription ?? "(sem descrição)"}`,
        `Anotações sobre este caso: ${input.notes || "(sem anotações)"}`,
        "",
        "De 2 a 4 parágrafos curtos, descrevendo o que está incluído e como o serviço é executado.",
        "Não invente prazo, valor ou entregável que não tenha sido informado.",
      ].join("\n");
  }
}

/** Resumo curto da entrada, para registrar em `AIInteraction` sem guardar tudo. */
export function summarizeInput(input: SuggestionInput): string {
  switch (input.kind) {
    case "REDIGIR_OCORRENCIA":
      return `Ocorrência: ${input.title}`;
    case "SUGERIR_FOLLOW_UP":
      return `Follow-up: ${input.leadName}`;
    case "REDIGIR_ESCOPO":
      return `Escopo: ${input.serviceName}`;
  }
}
