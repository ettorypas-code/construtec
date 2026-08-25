"use client";

import { useState, useTransition } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/ui/states";
import type { ActionResult } from "@/lib/actions/result";
import { acceptSuggestionAction } from "@/app/(app)/actions-ai";

type Suggestion = { interactionId: string; text: string };

/**
 * Botão de sugestão automática.
 *
 * O texto gerado nunca entra direto no campo: aparece como rascunho, com o
 * carimbo de que precisa de validação, e só é aplicado quando a pessoa clica
 * em "Usar este texto". Esse clique é o que marca `acceptedByUser` — a
 * fronteira entre "a IA propôs" e "o profissional assinou embaixo".
 *
 * Quando a IA está desligada (sem chave de API), o componente inteiro não é
 * renderizado pelo pai: nenhum fluxo depende dele.
 */
export function SuggestButton({
  label = "Sugerir texto",
  request,
  onApply,
}: {
  label?: string;
  request: () => Promise<ActionResult<Suggestion>>;
  onApply: (text: string) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const [error, setError] = useState<string | null>(null);

  function generate() {
    startTransition(async () => {
      setError(null);
      const result = await request();
      if (result.ok) setSuggestion(result.data);
      else setError(result.error);
    });
  }

  function apply() {
    if (!suggestion) return;
    onApply(suggestion.text);
    const { interactionId } = suggestion;
    setSuggestion(null);
    startTransition(async () => {
      await acceptSuggestionAction({ interactionId });
    });
  }

  return (
    <div className="space-y-2">
      <FormError message={error} />

      {suggestion ? (
        <div className="rounded-control border border-brand-200 bg-brand-50/60 p-3">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-brand-700">
            <Sparkles className="size-3.5" />
            Sugestão automática — requer validação profissional
          </p>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-ink-700">
            {suggestion.text}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" onClick={apply}>
              Usar este texto
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setSuggestion(null)}>
              Descartar
            </Button>
            <Button size="sm" variant="ghost" loading={pending} onClick={generate}>
              Gerar outra
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={generate}
          disabled={pending}
          className="inline-flex items-center gap-1.5 rounded-control border border-ink-200 bg-surface px-2.5 py-1.5 text-xs font-medium text-ink-600 transition-colors hover:bg-ink-50 disabled:opacity-50"
        >
          <Sparkles className="size-3.5 text-brand-600" />
          {pending ? "Gerando…" : label}
        </button>
      )}
    </div>
  );
}
