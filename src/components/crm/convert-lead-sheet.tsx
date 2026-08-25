"use client";

import { useActionState, useState } from "react";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/form";
import { FormError } from "@/components/ui/states";
import { SubmitButton } from "@/components/ui/submit-button";
import { Sheet } from "@/components/ui/sheet";
import { ClientKind } from "@/domain/enums";
import { clientKindLabels, toOptions } from "@/domain/labels";
import type { ActionResult } from "@/lib/actions/result";
import { convertLeadAction } from "@/app/(app)/crm/actions";

const kindOptions = toOptions(clientKindLabels);

/**
 * Converte o lead em cliente. Nome, telefone e e-mail já vêm do lead — aqui só
 * se pede o que falta para emitir documento e cobrar.
 */
export function ConvertLeadSheet({ leadId, leadName }: { leadId: string; leadName: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState<ActionResult<unknown> | null, FormData>(
    convertLeadAction,
    null,
  );

  const errors = state && !state.ok ? state.fieldErrors : undefined;
  const generalError = state && !state.ok && !state.fieldErrors ? state.error : null;

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <UserPlus className="size-4" />
        Converter em cliente
      </Button>

      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title="Converter em cliente"
        description={leadName}
      >
        <form action={formAction} className="space-y-4" noValidate>
          <input type="hidden" name="leadId" value={leadId} />

          <FormError message={generalError} />

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Tipo" htmlFor="kind" error={errors?.kind}>
              <Select id="kind" name="kind" options={kindOptions} defaultValue={ClientKind.PF} />
            </Field>

            <Field label="CPF ou CNPJ" htmlFor="document" error={errors?.document}>
              <Input id="document" name="document" inputMode="numeric" placeholder="Opcional" />
            </Field>
          </div>

          <Field label="Endereço" htmlFor="addressLine" error={errors?.addressLine}>
            <Input id="addressLine" name="addressLine" placeholder="Rua, número, complemento" />
          </Field>

          <div className="grid grid-cols-3 gap-4">
            <Field label="Cidade" htmlFor="city" error={errors?.city} className="col-span-2">
              <Input id="city" name="city" />
            </Field>
            <Field label="UF" htmlFor="state" error={errors?.state}>
              <Input id="state" name="state" maxLength={2} placeholder="SP" />
            </Field>
          </div>

          <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <SubmitButton pendingLabel="Convertendo…">Criar cliente</SubmitButton>
          </div>
        </form>
      </Sheet>
    </>
  );
}
