"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Field, FieldGroup, Input, MoneyInput, Select, Textarea } from "@/components/ui/form";
import { FormError } from "@/components/ui/states";
import { SubmitButton } from "@/components/ui/submit-button";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { LeadSource, LeadStatus } from "@/domain/enums";
import { leadSourceLabels, leadStatusLabels, toOptions, type Option } from "@/domain/labels";
import { formatAmount } from "@/lib/utils/money";
import { toDateInput } from "@/lib/utils/dates";
import type { ActionResult } from "@/lib/actions/result";
import type { FormAction } from "@/lib/actions/action";

export type LeadFormValues = {
  id?: string;
  name: string;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  source: string;
  serviceTypeId: string | null;
  serviceNote: string | null;
  potentialValueCents: number | null;
  status: string;
  notes: string | null;
  nextContactAt: Date | null;
  lostReason?: string | null;
};

const sourceOptions = toOptions(leadSourceLabels);
const statusOptions = toOptions(leadStatusLabels);

export function LeadForm({
  action,
  serviceOptions,
  defaults,
  submitLabel = "Salvar",
  cancelHref,
}: {
  action: FormAction<unknown>;
  serviceOptions: Option<string>[];
  defaults?: Partial<LeadFormValues>;
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
  const generalError = state && !state.ok && !state.fieldErrors ? state.error : null;

  return (
    <form action={formAction} className="space-y-6" noValidate>
      {defaults?.id ? <input type="hidden" name="id" value={defaults.id} /> : null}

      <FormError message={generalError} />

      <FieldGroup title="Contato">
        <Field label="Nome" htmlFor="name" error={errors?.name} required>
          <Input
            id="name"
            name="name"
            defaultValue={defaults?.name ?? ""}
            autoFocus={!defaults?.id}
            placeholder="Nome de quem procurou"
            invalid={Boolean(errors?.name)}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Telefone" htmlFor="phone" error={errors?.phone}>
            <Input
              id="phone"
              name="phone"
              type="tel"
              inputMode="tel"
              defaultValue={defaults?.phone ?? ""}
              placeholder="(11) 90000-0000"
              invalid={Boolean(errors?.phone)}
            />
          </Field>

          <Field
            label="WhatsApp"
            htmlFor="whatsapp"
            error={errors?.whatsapp}
            hint="Se vazio, usamos o telefone."
          >
            <Input
              id="whatsapp"
              name="whatsapp"
              type="tel"
              inputMode="tel"
              defaultValue={defaults?.whatsapp ?? ""}
              placeholder="(11) 90000-0000"
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
            placeholder="cliente@email.com"
            invalid={Boolean(errors?.email)}
          />
        </Field>
      </FieldGroup>

      <FieldGroup title="Oportunidade">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Origem" htmlFor="source" error={errors?.source}>
            <Select
              id="source"
              name="source"
              options={sourceOptions}
              defaultValue={defaults?.source ?? LeadSource.INDICACAO}
            />
          </Field>

          <Field label="Estágio" htmlFor="status" error={errors?.status}>
            <Select
              id="status"
              name="status"
              options={statusOptions}
              defaultValue={defaults?.status ?? LeadStatus.NOVO}
            />
          </Field>
        </div>

        <Field label="Serviço desejado" htmlFor="serviceTypeId" error={errors?.serviceTypeId}>
          <Select
            id="serviceTypeId"
            name="serviceTypeId"
            options={serviceOptions}
            placeholder="Ainda não definido"
            defaultValue={defaults?.serviceTypeId ?? ""}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Valor potencial"
            htmlFor="potentialValueCents"
            error={errors?.potentialValueCents}
          >
            <MoneyInput
              id="potentialValueCents"
              name="potentialValueCents"
              defaultValue={
                defaults?.potentialValueCents ? formatAmount(defaults.potentialValueCents) : ""
              }
              invalid={Boolean(errors?.potentialValueCents)}
            />
          </Field>

          <Field label="Próximo contato" htmlFor="nextContactAt" error={errors?.nextContactAt}>
            <Input
              id="nextContactAt"
              name="nextContactAt"
              type="date"
              defaultValue={toDateInput(defaults?.nextContactAt)}
              invalid={Boolean(errors?.nextContactAt)}
            />
          </Field>
        </div>

        <Field
          label="Detalhe do pedido"
          htmlFor="serviceNote"
          error={errors?.serviceNote}
          hint="Ex.: apartamento de 65 m², entrega em novembro."
        >
          <Input
            id="serviceNote"
            name="serviceNote"
            defaultValue={defaults?.serviceNote ?? ""}
            invalid={Boolean(errors?.serviceNote)}
          />
        </Field>
      </FieldGroup>

      <FieldGroup title="Observações">
        <Field label="Anotações" htmlFor="notes" error={errors?.notes}>
          <Textarea
            id="notes"
            name="notes"
            rows={4}
            defaultValue={defaults?.notes ?? ""}
            placeholder="O que este cliente precisa, restrições, prazos…"
            invalid={Boolean(errors?.notes)}
          />
        </Field>

        {defaults?.id ? (
          <Field
            label="Motivo da perda"
            htmlFor="lostReason"
            hint="Preenchido apenas quando o estágio é Perdido."
            error={errors?.lostReason}
          >
            <Input
              id="lostReason"
              name="lostReason"
              defaultValue={defaults?.lostReason ?? ""}
              placeholder="Preço, prazo, escolheu outro fornecedor…"
            />
          </Field>
        ) : null}
      </FieldGroup>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={() => router.push(cancelHref)}>
          Cancelar
        </Button>
        <SubmitButton pendingLabel="Salvando…">{submitLabel}</SubmitButton>
      </div>
    </form>
  );
}
