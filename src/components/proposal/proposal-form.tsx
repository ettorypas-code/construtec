"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Field, FieldGroup, Input, MoneyInput, Select, Textarea } from "@/components/ui/form";
import { FormError } from "@/components/ui/states";
import { SubmitButton } from "@/components/ui/submit-button";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { formatAmount } from "@/lib/utils/money";
import { toDateInput } from "@/lib/utils/dates";
import type { Option } from "@/domain/labels";
import type { ActionResult } from "@/lib/actions/result";
import type { FormAction } from "@/lib/actions/action";

export function ProposalForm({
  action,
  clientOptions,
  leadOptions,
  serviceOptions,
  budgetOptions,
  defaults,
  submitLabel = "Salvar",
  cancelHref,
}: {
  action: FormAction<unknown>;
  clientOptions: Option<string>[];
  leadOptions: Option<string>[];
  serviceOptions: Option<string>[];
  budgetOptions: Option<string>[];
  defaults?: {
    id?: string;
    title?: string;
    clientId?: string | null;
    leadId?: string | null;
    serviceTypeId?: string | null;
    budgetId?: string | null;
    scopeText?: string | null;
    exclusionsText?: string | null;
    deadlineText?: string | null;
    paymentTerms?: string | null;
    notes?: string | null;
    discountCents?: number | null;
    validUntil?: Date | null;
  };
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
        <Field label="Título" htmlFor="title" error={errors?.title} required>
          <Input
            id="title"
            name="title"
            defaultValue={defaults?.title ?? ""}
            autoFocus={!defaults?.id}
            placeholder="Vistoria de entrega — Residencial Aurora, 1204"
            invalid={Boolean(errors?.title)}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Cliente"
            htmlFor="clientId"
            error={errors?.clientId}
            hint="Use lead quando ainda não houver cadastro."
          >
            <Select
              id="clientId"
              name="clientId"
              options={clientOptions}
              placeholder="Sem cliente"
              defaultValue={defaults?.clientId ?? ""}
            />
          </Field>

          <Field label="Lead" htmlFor="leadId" error={errors?.leadId}>
            <Select
              id="leadId"
              name="leadId"
              options={leadOptions}
              placeholder="Sem lead"
              defaultValue={defaults?.leadId ?? ""}
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Serviço" htmlFor="serviceTypeId" error={errors?.serviceTypeId}>
            <Select
              id="serviceTypeId"
              name="serviceTypeId"
              options={serviceOptions}
              placeholder="Sem serviço"
              defaultValue={defaults?.serviceTypeId ?? ""}
            />
          </Field>

          <Field
            label="Orçamento"
            htmlFor="budgetId"
            error={errors?.budgetId}
            hint="Vincular importa os itens automaticamente."
          >
            <Select
              id="budgetId"
              name="budgetId"
              options={budgetOptions}
              placeholder="Sem orçamento"
              defaultValue={defaults?.budgetId ?? ""}
            />
          </Field>
        </div>
      </FieldGroup>

      <FieldGroup title="Conteúdo">
        <Field label="Escopo" htmlFor="scopeText" error={errors?.scopeText}>
          <Textarea
            id="scopeText"
            name="scopeText"
            rows={5}
            defaultValue={defaults?.scopeText ?? ""}
            placeholder="O que está incluído no serviço, em texto corrido."
          />
        </Field>

        <Field label="Não incluso" htmlFor="exclusionsText" error={errors?.exclusionsText}>
          <Textarea
            id="exclusionsText"
            name="exclusionsText"
            rows={3}
            defaultValue={defaults?.exclusionsText ?? ""}
            placeholder="O que fica de fora — evita discussão depois."
          />
        </Field>

        <Field label="Prazo" htmlFor="deadlineText" error={errors?.deadlineText}>
          <Input
            id="deadlineText"
            name="deadlineText"
            defaultValue={defaults?.deadlineText ?? ""}
            placeholder="Relatório entregue em até 3 dias úteis após a vistoria."
          />
        </Field>

        <Field label="Condições de pagamento" htmlFor="paymentTerms" error={errors?.paymentTerms}>
          <Textarea
            id="paymentTerms"
            name="paymentTerms"
            rows={2}
            defaultValue={defaults?.paymentTerms ?? ""}
          />
        </Field>
      </FieldGroup>

      <FieldGroup title="Comercial">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Desconto" htmlFor="discountCents" error={errors?.discountCents}>
            <MoneyInput
              id="discountCents"
              name="discountCents"
              defaultValue={defaults?.discountCents ? formatAmount(defaults.discountCents) : ""}
            />
          </Field>

          <Field label="Válida até" htmlFor="validUntil" error={errors?.validUntil}>
            <Input
              id="validUntil"
              name="validUntil"
              type="date"
              defaultValue={toDateInput(defaults?.validUntil)}
            />
          </Field>
        </div>

        <Field label="Observações" htmlFor="notes" error={errors?.notes}>
          <Textarea id="notes" name="notes" rows={3} defaultValue={defaults?.notes ?? ""} />
        </Field>
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
