"use client";

import { useActionState, useState } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { Field, Input } from "@/components/ui/form";
import { FormError } from "@/components/ui/states";
import { SubmitButton } from "@/components/ui/submit-button";
import type { ActionResult } from "@/lib/actions/result";
import { createRevisitAction } from "@/app/(app)/vistorias/actions";

/**
 * Abrir revistoria.
 *
 * A folha mostra a conta antes de criar — quantos itens e quantas ocorrências
 * vão voltar ao imóvel. É a informação que decide se a viagem se paga, e é o
 * argumento que ele repete para o cliente ao vender a segunda visita.
 */
export function RevisitSheet({
  inspectionId,
  parentCode,
  itemCount,
  findingCount,
}: {
  inspectionId: string;
  parentCode: string;
  itemCount: number;
  findingCount: number;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState<ActionResult<unknown> | null, FormData>(
    createRevisitAction,
    null,
  );

  const errors = state && !state.ok ? state.fieldErrors : undefined;
  const generalError = state && !state.ok ? state.error : null;

  const total = itemCount + findingCount;

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <RotateCcw className="size-4" />
        Revistoria
      </Button>

      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title="Abrir revistoria"
        description={`Conferência das correções de ${parentCode}.`}
      >
        <form action={formAction} className="space-y-4" noValidate>
          <input type="hidden" name="parentId" value={inspectionId} />

          <FormError message={generalError} />

          <div className="rounded-control border border-brand-200 bg-brand-50/40 px-3.5 py-3">
            <p className="text-sm font-medium text-ink-900">
              {total === 0
                ? "Nada em aberto para conferir"
                : `${total} ponto(s) voltam para conferência`}
            </p>
            <ul className="mt-1.5 space-y-1 text-sm leading-relaxed text-ink-600">
              <li>· {itemCount} item(ns) do checklist marcados como problema</li>
              <li>· {findingCount} ocorrência(s) ainda em aberto</li>
            </ul>
            <p className="mt-2 text-xs leading-relaxed text-ink-500">
              O que estava conforme não volta. Cada ponto chega com a foto e a
              avaliação da vistoria original ao lado, para conferir olhando.
            </p>
          </div>

          <Field
            label="Data da revistoria"
            htmlFor="revisit-date"
            error={errors?.scheduledAt}
            hint="Opcional. Preenchida, já entra na agenda."
          >
            <Input id="revisit-date" name="scheduledAt" type="datetime-local" />
          </Field>

          <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <SubmitButton pendingLabel="Criando…">Criar revistoria</SubmitButton>
          </div>
        </form>
      </Sheet>
    </>
  );
}
