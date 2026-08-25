"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { SuggestButton } from "@/components/ai/suggest-button";
import { suggestFollowUpAction } from "@/app/(app)/actions-ai";

/**
 * Sugestão de mensagem de follow-up.
 *
 * O texto não é enviado por aqui — é copiado e colado no WhatsApp, que é onde o
 * cliente realmente responde. Envio automático depende da API oficial e está
 * na Fase 4 do roadmap.
 */
export function FollowUpSuggestion({
  leadId,
  whatsappNumber,
}: {
  leadId: string;
  whatsappNumber: string | null;
}) {
  const { toast } = useToast();
  const [message, setMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function copy() {
    if (!message) return;
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      toast("Mensagem copiada.");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast("Não foi possível copiar. Selecione o texto manualmente.", "error");
    }
  }

  return (
    <div className="space-y-3">
      <SuggestButton
        label="Sugerir mensagem de follow-up"
        request={() => suggestFollowUpAction({ leadId })}
        onApply={setMessage}
      />

      {message ? (
        <div className="rounded-control border border-ink-200 bg-ink-50 p-3">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink-700">{message}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={copy}
              className="inline-flex items-center gap-1.5 rounded-control border border-ink-200 bg-surface px-2.5 py-1.5 text-xs font-medium text-ink-700 transition-colors hover:bg-ink-100"
            >
              {copied ? (
                <Check className="size-3.5 text-success" />
              ) : (
                <Copy className="size-3.5 text-ink-400" />
              )}
              Copiar
            </button>

            {whatsappNumber ? (
              <a
                href={`https://wa.me/55${whatsappNumber}?text=${encodeURIComponent(message)}`}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1.5 rounded-control border border-success/30 bg-success-soft px-2.5 py-1.5 text-xs font-medium text-success transition-colors hover:brightness-95"
              >
                Abrir no WhatsApp
              </a>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
