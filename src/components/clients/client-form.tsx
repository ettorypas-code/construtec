"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Field, FieldGroup, Input, Select, Textarea } from "@/components/ui/form";
import { FormError } from "@/components/ui/states";
import { SubmitButton } from "@/components/ui/submit-button";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { ClientKind } from "@/domain/enums";
import { clientKindLabels, toOptions } from "@/domain/labels";
import type { ActionResult } from "@/lib/actions/result";
import type { FormAction } from "@/lib/actions/action";

const kindOptions = toOptions(clientKindLabels);

export type ClientFormValues = {
  id?: string;
  kind: string;
  name: string;
  document: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  addressLine: string | null;
  district: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  notes: string | null;
};

export function ClientForm({
  action,
  defaults,
  submitLabel = "Salvar",
  cancelHref,
}: {
  action: FormAction<unknown>;
  defaults?: Partial<ClientFormValues>;
  submitLabel?: string;
  cancelHref: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [state, formAction] = useActionState<ActionResult<unknown> | null, FormData>(action, null);

  useEffect(() => {
    if (state?.ok && state.message) toast(state.message);
  }, [state, toast]);

  const errors = state && !state.ok ? state.fieldErrors : undefined;
  // Sempre visível quando a ação falha. Mostrar só erros por campo esconde a
  // falha inteira quando o campo culpado não está renderizado na tela.
  const generalError = state && !state.ok ? state.error : null;

  return (
    <form action={formAction} className="space-y-6" noValidate>
      {defaults?.id ? <input type="hidden" name="id" value={defaults.id} /> : null}

      <FormError message={generalError} />

      <FieldGroup title="Identificação">
        <div className="grid gap-4 sm:grid-cols-[10rem_1fr]">
          <Field label="Tipo" htmlFor="kind" error={errors?.kind}>
            <Select
              id="kind"
              name="kind"
              options={kindOptions}
              defaultValue={defaults?.kind ?? ClientKind.PF}
            />
          </Field>

          <Field label="Nome ou razão social" htmlFor="name" error={errors?.name} required>
            <Input
              id="name"
              name="name"
              defaultValue={defaults?.name ?? ""}
              autoFocus={!defaults?.id}
              invalid={Boolean(errors?.name)}
            />
          </Field>
        </div>

        <Field label="CPF ou CNPJ" htmlFor="document" error={errors?.document}>
          <Input
            id="document"
            name="document"
            inputMode="numeric"
            defaultValue={defaults?.document ?? ""}
            invalid={Boolean(errors?.document)}
          />
        </Field>
      </FieldGroup>

      <FieldGroup title="Contato">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Telefone" htmlFor="phone" error={errors?.phone}>
            <Input
              id="phone"
              name="phone"
              type="tel"
              inputMode="tel"
              defaultValue={defaults?.phone ?? ""}
              invalid={Boolean(errors?.phone)}
            />
          </Field>

          <Field label="WhatsApp" htmlFor="whatsapp" error={errors?.whatsapp}>
            <Input
              id="whatsapp"
              name="whatsapp"
              type="tel"
              inputMode="tel"
              defaultValue={defaults?.whatsapp ?? ""}
              invalid={Boolean(errors?.whatsapp)}
            />
          </Field>
        </div>

        <Field label="E-mail" htmlFor="email" error={errors?.email}>
          <Input
            id="email"
            name="email"
            type="email"
            defaultValue={defaults?.email ?? ""}
            invalid={Boolean(errors?.email)}
          />
        </Field>
      </FieldGroup>

      <FieldGroup title="Endereço">
        <Field label="Logradouro" htmlFor="addressLine" error={errors?.addressLine}>
          <Input
            id="addressLine"
            name="addressLine"
            defaultValue={defaults?.addressLine ?? ""}
            placeholder="Rua, número, complemento"
            invalid={Boolean(errors?.addressLine)}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Bairro" htmlFor="district" error={errors?.district}>
            <Input id="district" name="district" defaultValue={defaults?.district ?? ""} />
          </Field>
          <Field label="CEP" htmlFor="zipCode" error={errors?.zipCode}>
            <Input
              id="zipCode"
              name="zipCode"
              inputMode="numeric"
              defaultValue={defaults?.zipCode ?? ""}
            />
          </Field>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Field label="Cidade" htmlFor="city" error={errors?.city} className="col-span-2">
            <Input id="city" name="city" defaultValue={defaults?.city ?? ""} />
          </Field>
          <Field label="UF" htmlFor="state" error={errors?.state}>
            <Input
              id="state"
              name="state"
              maxLength={2}
              defaultValue={defaults?.state ?? ""}
              placeholder="SP"
            />
          </Field>
        </div>
      </FieldGroup>

      <Field label="Observações" htmlFor="notes" error={errors?.notes}>
        <Textarea id="notes" name="notes" rows={3} defaultValue={defaults?.notes ?? ""} />
      </Field>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={() => router.push(cancelHref)}>
          Cancelar
        </Button>
        <SubmitButton pendingLabel="Salvando…">{submitLabel}</SubmitButton>
      </div>
    </form>
  );
}
