"use client";

import { useActionState, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { FormError } from "@/components/ui/states";
import { SubmitButton } from "@/components/ui/submit-button";
import { Sheet } from "@/components/ui/sheet";
import { useToast } from "@/components/ui/toast";
import { PropertyKind } from "@/domain/enums";
import { propertyKindLabels, toOptions } from "@/domain/labels";
import type { ActionResult } from "@/lib/actions/result";
import { createPropertyAction } from "@/app/(app)/clientes/actions";

const kindOptions = toOptions(propertyKindLabels);

/**
 * Cadastro de imóvel a partir da ficha do cliente.
 *
 * Empreendimento, torre e unidade vêm antes do endereço porque, em vistoria de
 * entrega, é assim que o imóvel é identificado na prática.
 */
export function PropertySheet({ clientId }: { clientId: string }) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  // Fechar a folha acontece dentro da própria action, não em um efeito: o
  // resultado já chega aqui dentro da transição, e um `useEffect` observando
  // `state` só criaria uma renderização em cascata.
  const [state, formAction] = useActionState<ActionResult<unknown> | null, FormData>(
    async (previous: ActionResult<unknown> | null, formData: FormData) => {
      const result = await createPropertyAction(previous, formData);
      if (result.ok) {
        toast(result.message ?? "Imóvel cadastrado.");
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
        Adicionar imóvel
      </Button>

      <Sheet open={open} onClose={() => setOpen(false)} title="Novo imóvel">
        <form action={formAction} className="space-y-4" noValidate>
          <input type="hidden" name="clientId" value={clientId} />

          <FormError message={generalError} />

          <Field label="Tipo" htmlFor="kind" error={errors?.kind}>
            <Select
              id="kind"
              name="kind"
              options={kindOptions}
              defaultValue={PropertyKind.APARTAMENTO}
            />
          </Field>

          <Field label="Empreendimento" htmlFor="development" error={errors?.development}>
            <Input id="development" name="development" placeholder="Residencial Aurora" />
          </Field>

          <div className="grid grid-cols-3 gap-4">
            <Field label="Torre" htmlFor="tower" error={errors?.tower}>
              <Input id="tower" name="tower" placeholder="B" />
            </Field>
            <Field label="Unidade" htmlFor="unit" error={errors?.unit}>
              <Input id="unit" name="unit" placeholder="1204" />
            </Field>
            <Field label="Área (m²)" htmlFor="areaSqm" error={errors?.areaSqm}>
              <Input id="areaSqm" name="areaSqm" inputMode="decimal" placeholder="65" />
            </Field>
          </div>

          <Field label="Endereço" htmlFor="addressLine" error={errors?.addressLine}>
            <Input id="addressLine" name="addressLine" placeholder="Rua, número" />
          </Field>

          <div className="grid grid-cols-3 gap-4">
            <Field label="Cidade" htmlFor="city" error={errors?.city} className="col-span-2">
              <Input id="city" name="city" />
            </Field>
            <Field label="UF" htmlFor="state" error={errors?.state}>
              <Input id="state" name="state" maxLength={2} />
            </Field>
          </div>

          <Field label="Observações" htmlFor="notes" error={errors?.notes}>
            <Textarea id="notes" name="notes" rows={2} />
          </Field>

          <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <SubmitButton pendingLabel="Salvando…">Cadastrar imóvel</SubmitButton>
          </div>
        </form>
      </Sheet>
    </>
  );
}
