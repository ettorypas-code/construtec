"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Field, FieldGroup, Input, Select, Textarea } from "@/components/ui/form";
import { FormError } from "@/components/ui/states";
import { SubmitButton } from "@/components/ui/submit-button";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { BudgetStatus } from "@/domain/enums";
import { projectKindLabels, toOptions, type Option } from "@/domain/labels";
import type { ActionResult } from "@/lib/actions/result";
import type { FormAction } from "@/lib/actions/action";

const statusLabels: Record<BudgetStatus, string> = {
  RASCUNHO: "Rascunho",
  FECHADO: "Fechado",
  CONVERTIDO: "Convertido em proposta",
};

const statusOptions = toOptions(statusLabels);
const projectKindOptions = toOptions(projectKindLabels);

export type BudgetFormValues = {
  id?: string;
  name?: string;
  clientId?: string | null;
  serviceTypeId?: string | null;
  projectKind?: string | null;
  areaSqm?: number | null;
  addressLine?: string | null;
  city?: string | null;
  reference?: string | null;
  deadlineText?: string | null;
  bdiPercent?: number;
  status?: string;
  notes?: string | null;
};

export function BudgetForm({
  action,
  clientOptions,
  serviceOptions,
  defaults,
  defaultBdi,
  submitLabel = "Salvar",
  cancelHref,
}: {
  action: FormAction<unknown>;
  clientOptions: Option<string>[];
  serviceOptions: Option<string>[];
  defaults?: BudgetFormValues;
  defaultBdi: number;
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

      <FieldGroup title="Identificação">
        <Field label="Nome do orçamento" htmlFor="name" error={errors?.name} required>
          <Input
            id="name"
            name="name"
            defaultValue={defaults?.name ?? ""}
            autoFocus={!defaults?.id}
            placeholder="Reforma apartamento — Rua das Acácias, 120"
            invalid={Boolean(errors?.name)}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Cliente" htmlFor="clientId" error={errors?.clientId}>
            <Select
              id="clientId"
              name="clientId"
              options={clientOptions}
              placeholder="Sem cliente vinculado"
              defaultValue={defaults?.clientId ?? ""}
            />
          </Field>

          <Field label="Serviço" htmlFor="serviceTypeId" error={errors?.serviceTypeId}>
            <Select
              id="serviceTypeId"
              name="serviceTypeId"
              options={serviceOptions}
              placeholder="Sem serviço vinculado"
              defaultValue={defaults?.serviceTypeId ?? ""}
            />
          </Field>
        </div>

        <Field
          label="Referência do cliente"
          htmlFor="reference"
          error={errors?.reference}
          hint="Número do pedido, nome do projeto, o que o cliente usa para identificar."
        >
          <Input id="reference" name="reference" defaultValue={defaults?.reference ?? ""} />
        </Field>
      </FieldGroup>

      <FieldGroup
        title="Obra"
        description="Sem isso, comparar dois orçamentos antigos vira adivinhação."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Tipo de obra" htmlFor="projectKind" error={errors?.projectKind}>
            <Select
              id="projectKind"
              name="projectKind"
              options={projectKindOptions}
              placeholder="Não definido"
              defaultValue={defaults?.projectKind ?? ""}
            />
          </Field>

          <Field label="Área (m²)" htmlFor="areaSqm" error={errors?.areaSqm}>
            <Input
              id="areaSqm"
              name="areaSqm"
              inputMode="decimal"
              defaultValue={defaults?.areaSqm != null ? String(defaults.areaSqm) : ""}
              className="tabular"
              invalid={Boolean(errors?.areaSqm)}
            />
          </Field>
        </div>

        <Field label="Endereço da obra" htmlFor="addressLine" error={errors?.addressLine}>
          <Input
            id="addressLine"
            name="addressLine"
            defaultValue={defaults?.addressLine ?? ""}
            placeholder="Rua, número, complemento"
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Cidade" htmlFor="city" error={errors?.city}>
            <Input id="city" name="city" defaultValue={defaults?.city ?? ""} />
          </Field>

          <Field label="Prazo estimado" htmlFor="deadlineText" error={errors?.deadlineText}>
            <Input
              id="deadlineText"
              name="deadlineText"
              defaultValue={defaults?.deadlineText ?? ""}
              placeholder="45 dias corridos"
            />
          </Field>
        </div>
      </FieldGroup>

      <FieldGroup title="Cálculo">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="BDI padrão (%)"
            htmlFor="bdiPercent"
            error={errors?.bdiPercent}
            hint="Aplicado a todo item que não tiver BDI próprio."
          >
            <Input
              id="bdiPercent"
              name="bdiPercent"
              inputMode="decimal"
              defaultValue={String(defaults?.bdiPercent ?? defaultBdi)}
              className="tabular"
              invalid={Boolean(errors?.bdiPercent)}
            />
          </Field>

          <Field label="Situação" htmlFor="status" error={errors?.status}>
            <Select
              id="status"
              name="status"
              options={statusOptions}
              defaultValue={defaults?.status ?? BudgetStatus.RASCUNHO}
            />
          </Field>
        </div>

        <Field label="Observações internas" htmlFor="notes" error={errors?.notes}>
          <Textarea
            id="notes"
            name="notes"
            rows={3}
            defaultValue={defaults?.notes ?? ""}
            placeholder="Premissas, fornecedor consultado, o que ficou de fora do levantamento…"
          />
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
