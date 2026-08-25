"use client";

import { useState } from "react";
import { Check, Copy, MessageCircle, Sunrise } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";

/**
 * Resumo do dia no painel.
 *
 * O texto vem pronto do servidor. Aqui só existe o que precisa de navegador:
 * copiar e abrir o WhatsApp. É o caminho que funciona hoje, sem depender de
 * integração — abrir o app de manhã e mandar para si mesmo antes de sair.
 */
export function DailyDigestCard({
  text,
  whatsappNumber,
}: {
  text: string;
  whatsappNumber: string | null;
}) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast("Resumo copiado.");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast("Não foi possível copiar. Selecione o texto manualmente.", "error");
    }
  }

  return (
    <Card>
      <CardHeader
        title="Resumo do dia"
        description="Tudo o que precisa de você hoje, em um bloco."
        action={
          <div className="flex gap-2">
            <button
              type="button"
              onClick={copy}
              className="inline-flex items-center gap-1.5 rounded-control border border-ink-200 bg-surface px-2.5 py-1.5 text-xs font-medium text-ink-700 transition-colors hover:bg-ink-50"
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
                href={`https://wa.me/55${whatsappNumber}?text=${encodeURIComponent(text)}`}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1.5 rounded-control border border-success/30 bg-success-soft px-2.5 py-1.5 text-xs font-medium text-success transition-colors hover:brightness-95"
              >
                <MessageCircle className="size-3.5" />
                WhatsApp
              </a>
            ) : null}
          </div>
        }
      />
      <CardBody>
        <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-ink-700">
          {text}
        </pre>
      </CardBody>
    </Card>
  );
}

/** Versão vazia: dia livre é informação, não ausência de informação. */
export function EmptyDigestCard() {
  return (
    <Card className="border-brand-200 bg-brand-50/40">
      <CardBody className="flex items-start gap-3">
        <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
          <Sunrise className="size-4" />
        </span>
        <div>
          <p className="text-sm font-medium text-ink-900">Dia livre</p>
          <p className="mt-0.5 text-sm text-ink-600">
            Nenhum compromisso, tarefa aberta ou contato pendente para hoje.
          </p>
        </div>
      </CardBody>
    </Card>
  );
}
