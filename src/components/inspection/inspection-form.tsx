"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { Field, FieldGroup, Input, Select, Textarea } from "@/components/ui/form";
import { FormError } from "@/components/ui/states";
import { SubmitButton } from "@/components/ui/submit-button";
import { Button } from "@/components/ui/button";
import { DocumentKind } from "@/domain/enums";
import { documentKindLabels, type Option } from "@/domain/labels";
import type { ActionResult } from "@/lib/actions/result";
import { createInspectionAction } from "@/app/(app)/vistorias/actions";

/**
 * Criação de vistoria.
 *
 * A lista de tipos de documento já chega filtrada pela habilitação profissional
 * configurada — o que não pode ser emitido simplesmente não aparece, em vez de
 * aparecer e falhar depois.
 */
export function InspectionForm({
  clientOptions,
  propertyOptions,
  serviceOptions,
  templateOptions,
  documentKindOptions,
  defaults,
}: {
  clientOptions: Option<string>[];
  propertyOptions: Option<string>[];
  serviceOptions: Option<string>[];
  templateOptions: Option<string>[];
  documentKindOptions: Option<string>[];
  defaults?: { clientId?: string; propertyId?: string };
}) {
  const router = useRouter();
  const [state, formAction] = useActionState<ActionResult<unknown> | null, FormData>(
    createInspectionAction,
    null,
  );

  const errors = state && !state.ok ? state.fieldErrors : undefined;
  // Sempre visível quando a ação falha. Mostrar só erros por campo esconde a
  // falha inteira quando o campo culpado não está renderizado na tela.
  const generalError = state && !state.ok ? state.error : null;

  const defaultTemplate = templateOptions[0]?.value ?? "";

  return (
    <form action={formAction} className="space-y-6" noValidate>
      <FormError message={generalError} />

      <FieldGroup title="Identificação">
        <Field label="Título" htmlFor="title" error={errors?.title} required>
          <Input
            id="title"
            name="title"
            autoFocus
            placeholder="Vistoria de entrega — Residencial Aurora, 1204"
            invalid={Boolean(errors?.title)}
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

          <Field label="Imóvel" htmlFor="propertyId" error={errors?.propertyId}>
            <Select
              id="propertyId"
              name="propertyId"
              options={propertyOptions}
              placeholder="Sem imóvel vinculado"
              defaultValue={defaults?.propertyId ?? ""}
            />
          </Field>
        </div>
      </FieldGroup>

      <FieldGroup title="Escopo">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Serviço" htmlFor="serviceTypeId" error={errors?.serviceTypeId}>
            <Select
              id="serviceTypeId"
              name="serviceTypeId"
              options={serviceOptions}
              placeholder="Sem serviço vinculado"
            />
          </Field>

          <Field
            label="Tipo de documento"
            htmlFor="documentKind"
            error={errors?.documentKind}
            hint="Limitado pela habilitação configurada."
          >
            <Select
              id="documentKind"
              name="documentKind"
              options={documentKindOptions}
              defaultValue={DocumentKind.RELATORIO_VISTORIA}
            />
          </Field>
        </div>

        <Field
          label="Modelo de checklist"
          htmlFor="templateId"
          error={errors?.templateId}
          hint="Os ambientes e itens são copiados para esta vistoria."
        >
          <Select
            id="templateId"
            name="templateId"
            options={templateOptions}
            placeholder="Sem checklist (ambientes manuais)"
            defaultValue={defaultTemplate}
          />
        </Field>
      </FieldGroup>

      <FieldGroup title="Agendamento">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Data e hora"
            htmlFor="scheduledAt"
            error={errors?.scheduledAt}
            hint="Entra na agenda automaticamente."
          >
            <Input
              id="scheduledAt"
              name="scheduledAt"
              type="datetime-local"
              invalid={Boolean(errors?.scheduledAt)}
            />
          </Field>

          <Field label="Contato no local" htmlFor="contactName" error={errors?.contactName}>
            <Input id="contactName" name="contactName" placeholder="Quem abre o imóvel" />
          </Field>
        </div>

        <Field label="Telefone do contato" htmlFor="contactPhone" error={errors?.contactPhone}>
          <Input id="contactPhone" name="contactPhone" type="tel" inputMode="tel" />
        </Field>
      </FieldGroup>

      <Field label="Observações" htmlFor="notes" error={errors?.notes}>
        <Textarea id="notes" name="notes" rows={3} placeholder="Instruções, restrições de acesso…" />
      </Field>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={() => router.push("/vistorias")}>
          Cancelar
        </Button>
        <SubmitButton pendingLabel="Criando…">Criar vistoria</SubmitButton>
      </div>
    </form>
  );
}

export const documentKindOptionsFrom = (kinds: DocumentKind[]): Option<string>[] =>
  kinds.map((kind) => ({ value: kind, label: documentKindLabels[kind] }));
