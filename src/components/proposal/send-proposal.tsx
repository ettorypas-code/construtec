"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/ui/states";
import { useToast } from "@/components/ui/toast";
import { sendProposalAction } from "@/app/(app)/propostas/actions";

/**
 * Envio da proposta.
 *
 * "Enviar" aqui significa liberar o link público e marcar a data — o disparo da
 * mensagem continua sendo feito por WhatsApp ou e-mail, que é como o cliente
 * realmente responde. Integração de envio é Fase 4.
 */
export function SendProposalButton({ proposalId }: { proposalId: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      <FormError message={error} />
      <Button
        loading={pending}
        onClick={() =>
          startTransition(async () => {
            setError(null);
            const result = await sendProposalAction({ id: proposalId });
            if (result.ok) {
              toast("Proposta liberada. Copie o link e envie ao cliente.");
              router.refresh();
            } else {
              setError(result.error);
            }
          })
        }
      >
        <Send className="size-4" />
        Marcar como enviada
      </Button>
    </div>
  );
}

/** Copia o link público. Fica visível só depois que a proposta foi enviada. */
export function CopyLinkButton({ url }: { url: string }) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(url);
          setCopied(true);
          toast("Link copiado.");
          setTimeout(() => setCopied(false), 2000);
        } catch {
          toast("Não foi possível copiar. Selecione o link manualmente.", "error");
        }
      }}
      className="inline-flex w-full items-center gap-2 rounded-control border border-ink-200 bg-surface px-3 py-2.5 text-left text-sm text-ink-700 transition-colors hover:bg-ink-50"
    >
      {copied ? (
        <Check className="size-4 shrink-0 text-success" />
      ) : (
        <Copy className="size-4 shrink-0 text-ink-400" />
      )}
      <span className="min-w-0 flex-1 truncate font-mono text-xs">{url}</span>
    </button>
  );
}
