import "server-only";

import Anthropic from "@anthropic-ai/sdk";

/**
 * Adaptador de IA.
 *
 * Regras de produto que este arquivo materializa (ARQUITETURA.md, decisão D7):
 *
 *  1. É OPCIONAL. Sem `ANTHROPIC_API_KEY`, `isAiEnabled()` retorna false, a UI
 *     não mostra os botões de sugestão e nenhum fluxo quebra.
 *  2. É SUGESTIVA. Todo retorno é rascunho editável, nunca decisão. O prompt de
 *     sistema proíbe afirmação de causa e conclusão técnica definitiva.
 *  3. É RASTREÁVEL. Cada chamada é gravada em `AIInteraction` pelo serviço.
 */

const DEFAULT_MODEL = "claude-sonnet-5";
const MAX_TOKENS = 700;

export function isAiEnabled(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY?.trim());
}

export function aiModel(): string {
  return process.env.AI_MODEL?.trim() || DEFAULT_MODEL;
}

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY não configurada.");
    client = new Anthropic({ apiKey });
  }
  return client;
}

export type CompletionResult = {
  text: string;
  model: string;
  promptTokens: number | null;
  completionTokens: number | null;
};

/**
 * Regras de conduta aplicadas a toda chamada, independentemente do prompt.
 *
 * A restrição sobre causa não é preciosismo: afirmar origem de patologia é
 * diagnóstico técnico, que depende de habilitação profissional. Ver
 * `lib/compliance`.
 */
const SYSTEM_PROMPT = `Você apoia um profissional de construção civil que faz vistorias, orçamentos e gestão de obra no Brasil.

Regras invioláveis:
- Escreva em português do Brasil, em tom técnico, direto e sem adjetivos de venda.
- NUNCA afirme a causa de um problema construtivo. Descreva o que é observável.
- NUNCA conclua sobre responsabilidade, risco estrutural ou adequação a norma.
- NUNCA use os termos "laudo", "perícia" ou "parecer técnico" para descrever o documento.
- Quando algo exigir avaliação de profissional habilitado, diga isso explicitamente.
- Não invente medidas, valores, normas ou dados que não estejam na entrada.
- Responda apenas com o texto pedido, sem introdução, comentário ou formatação extra.

Suas saídas são rascunhos que o profissional vai revisar antes de usar.`;

export async function complete(userPrompt: string): Promise<CompletionResult> {
  const model = aiModel();

  const response = await getClient().messages.create({
    model,
    max_tokens: MAX_TOKENS,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt }],
  });

  const text = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("\n")
    .trim();

  return {
    text,
    model,
    promptTokens: response.usage?.input_tokens ?? null,
    completionTokens: response.usage?.output_tokens ?? null,
  };
}
