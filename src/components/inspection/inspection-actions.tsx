"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Play, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { Field, Input, Textarea } from "@/components/ui/form";
import { FormError } from "@/components/ui/states";
import { SubmitButton } from "@/components/ui/submit-button";
import { useToast } from "@/components/ui/toast";
import type { ActionResult } from "@/lib/actions/result";
import {
  addRoomAction,
  finishInspectionAction,
  startInspectionAction,
} from "@/app/(app)/vistorias/actions";

export function StartInspectionButton({ inspectionId }: { inspectionId: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      loading={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await startInspectionAction({ id: inspectionId });
          if (result.ok) {
            toast("Vistoria iniciada.");
            router.refresh();
          } else {
            toast(result.error, "error");
          }
        })
      }
    >
      <Play className="size-4" />
      Iniciar vistoria
    </Button>
  );
}

/**
 * Conclusão da vistoria.
 *
 * O resumo é opcional e vai para a capa do relatório. Concluir dispara a
 * automação que cria a tarefa de gerar o documento.
 */
export function FinishInspectionSheet({
  inspectionId,
  findingCount,
  pendingChecklistCount,
}: {
  inspectionId: string;
  findingCount: number;
  pendingChecklistCount: number;
}) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  // Fechar a folha acontece dentro da própria action, não em um efeito: o
  // resultado já chega aqui dentro da transição, e um `useEffect` observando
  // `state` só criaria uma renderização em cascata.
  const [state, formAction] = useActionState<ActionResult<unknown> | null, FormData>(
    async (previous: ActionResult<unknown> | null, formData: FormData) => {
      const result = await finishInspectionAction(previous, formData);
      if (result.ok) {
        toast(result.message ?? "Vistoria concluída.");
        setOpen(false);
      }
      return result;
    },
    null,
  );

  const generalError = state && !state.ok ? state.error : null;

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <CheckCircle2 className="size-4" />
        Concluir vistoria
      </Button>

      <Sheet open={open} onClose={() => setOpen(false)} title="Concluir vistoria">
        <form action={formAction} className="space-y-4" noValidate>
          <input type="hidden" name="id" value={inspectionId} />

          <FormError message={generalError} />

          <div className="rounded-control bg-ink-50 px-3 py-2.5 text-sm text-ink-600">
            <p>
              {findingCount === 0
                ? "Nenhuma ocorrência registrada."
                : `${findingCount} ${findingCount === 1 ? "ocorrência registrada" : "ocorrências registradas"}.`}
            </p>
            {pendingChecklistCount > 0 ? (
              <p className="mt-1 text-warning">
                {pendingChecklistCount} {pendingChecklistCount === 1 ? "item" : "itens"} do
                checklist ainda sem marcação. Eles aparecem como pendentes no relatório.
              </p>
            ) : null}
          </div>

          <Field
            label="Resumo da vistoria"
            htmlFor="summaryText"
            hint="Aparece na capa do documento. Opcional."
          >
            <Textarea
              id="summaryText"
              name="summaryText"
              rows={4}
              placeholder="Vistoria realizada com o comprador presente. Unidade entregue com acabamento concluído…"
            />
          </Field>

          <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <SubmitButton pendingLabel="Concluindo…">Concluir</SubmitButton>
          </div>
        </form>
      </Sheet>
    </>
  );
}

export function AddRoomSheet({ inspectionId }: { inspectionId: string }) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  // Fechar a folha acontece dentro da própria action, não em um efeito: o
  // resultado já chega aqui dentro da transição, e um `useEffect` observando
  // `state` só criaria uma renderização em cascata.
  const [state, formAction] = useActionState<ActionResult<unknown> | null, FormData>(
    async (previous: ActionResult<unknown> | null, formData: FormData) => {
      const result = await addRoomAction(previous, formData);
      if (result.ok) {
        toast(result.message ?? "Ambiente adicionado.");
        setOpen(false);
      }
      return result;
    },
    null,
  );

  const errors = state && !state.ok ? state.fieldErrors : undefined;
  const generalError = state && !state.ok && !state.fieldErrors ? state.error : null;

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Plus className="size-4" />
        Ambiente
      </Button>

      <Sheet open={open} onClose={() => setOpen(false)} title="Adicionar ambiente">
        <form action={formAction} className="space-y-4" noValidate>
          <input type="hidden" name="inspectionId" value={inspectionId} />

          <FormError message={generalError} />

          <Field label="Nome do ambiente" htmlFor="room-name" error={errors?.name} required>
            <Input
              id="room-name"
              name="name"
              autoFocus
              placeholder="Depósito, closet, lavabo…"
              invalid={Boolean(errors?.name)}
            />
          </Field>

          <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <SubmitButton pendingLabel="Adicionando…">Adicionar</SubmitButton>
          </div>
        </form>
      </Sheet>
    </>
  );
}
