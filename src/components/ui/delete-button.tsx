"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, TriangleAlert } from "lucide-react";
import { Button } from "./button";
import { Sheet } from "./sheet";
import { Input } from "./form";
import { FormError } from "./states";
import { useToast } from "./toast";
import type { ActionResult } from "@/lib/actions/result";

/** Toda ação de exclusão do sistema tem esta assinatura. */
export type DeleteAction = (input: { id: string }) => Promise<ActionResult<unknown>>;

/**
 * Botão de excluir.
 *
 * Um só componente para lead, vistoria e documento porque a decisão difícil é
 * sempre a mesma: mostrar **o que se perde** antes de perguntar se pode. Uma
 * caixa de "tem certeza?" sem essa lista é uma pergunta que ninguém consegue
 * responder — a pessoa clica em sim porque já decidiu clicar em excluir.
 *
 * O atrito é proporcional ao estrago. `confirmWord` só entra quando refazer o
 * trabalho significa voltar ao imóvel: aí exigir que o código seja digitado
 * impede o clique automático. Para o que se regenera, confirmar basta.
 */
export function DeleteButton({
  action,
  id,
  title,
  entityLabel,
  consequences,
  warning,
  confirmWord,
  confirmLabel = "Excluir",
  successMessage,
  redirectTo,
  variant = "icon",
  triggerLabel = "Excluir",
}: {
  action: DeleteAction;
  id: string;
  title: string;
  entityLabel: string;
  consequences: string[];
  warning?: string;
  /** Exigido no campo de confirmação. Ausente, basta clicar. */
  confirmWord?: string | null;
  confirmLabel?: string;
  successMessage: string;
  /** Para onde ir depois. Ausente, apenas atualiza a tela atual. */
  redirectTo?: string;
  variant?: "icon" | "button";
  triggerLabel?: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [texto, setTexto] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const travado = Boolean(confirmWord) && texto.trim().toUpperCase() !== confirmWord!.toUpperCase();

  function fechar() {
    setOpen(false);
    setTexto("");
    setErro(null);
  }

  function excluir() {
    setErro(null);
    startTransition(async () => {
      const result = await action({ id });

      if (!result.ok) {
        setErro(result.error);
        return;
      }

      toast(successMessage);
      setOpen(false);

      if (redirectTo) {
        router.push(redirectTo);
      }
      // Mesmo com push: a lista de destino pode estar em cache.
      router.refresh();
    });
  }

  return (
    <>
      {variant === "icon" ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={`${triggerLabel} — ${entityLabel}`}
          title={triggerLabel}
          className="flex size-11 shrink-0 items-center justify-center rounded-control text-ink-400 transition-colors hover:bg-danger-soft hover:text-danger sm:size-10"
        >
          <Trash2 className="size-4" />
        </button>
      ) : (
        <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
          <Trash2 className="size-4" />
          {triggerLabel}
        </Button>
      )}

      <Sheet
        open={open}
        onClose={fechar}
        title={title}
        description="Esta ação não pode ser desfeita."
        footer={
          <div className="flex gap-2">
            <Button variant="outline" fullWidth onClick={fechar} disabled={pending}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              fullWidth
              onClick={excluir}
              loading={pending}
              disabled={travado}
            >
              {confirmLabel}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <FormError message={erro} />

          <p className="text-sm leading-relaxed text-ink-700">
            Você está excluindo{" "}
            <span className="font-medium text-ink-900">{entityLabel}</span>.
          </p>

          <div className="rounded-control border border-danger/25 bg-danger-soft px-3.5 py-3">
            <p className="flex items-center gap-2 text-sm font-semibold text-danger">
              <TriangleAlert className="size-4 shrink-0" />
              O que vai junto
            </p>
            <ul className="mt-2 space-y-1.5">
              {consequences.map((item) => (
                <li key={item} className="text-sm leading-relaxed text-ink-700">
                  · {item}
                </li>
              ))}
            </ul>
          </div>

          {warning ? (
            <p className="rounded-control border border-warning/25 bg-warning-soft px-3.5 py-3 text-sm leading-relaxed text-ink-700">
              {warning}
            </p>
          ) : null}

          {confirmWord ? (
            <div>
              <label
                htmlFor="confirmar-exclusao"
                className="text-sm font-medium leading-relaxed text-ink-700"
              >
                Para confirmar, digite{" "}
                <span className="font-mono font-semibold text-ink-900">{confirmWord}</span>
              </label>
              <Input
                id="confirmar-exclusao"
                value={texto}
                onChange={(event) => setTexto(event.target.value)}
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                placeholder={confirmWord}
                className="mt-1.5 font-mono"
              />
            </div>
          ) : null}
        </div>
      </Sheet>
    </>
  );
}
