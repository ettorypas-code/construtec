"use client";

import { useActionState, useEffect, useState } from "react";
import { ShieldCheck, TriangleAlert } from "lucide-react";
import {
  Checkbox,
  Field,
  FieldGroup,
  Input,
  Select,
  Textarea,
} from "@/components/ui/form";
import { FormError } from "@/components/ui/states";
import { SubmitButton } from "@/components/ui/submit-button";
import { useToast } from "@/components/ui/toast";
import { CouncilType } from "@/domain/enums";
import { councilTypeLabels, documentKindLabels, toOptions } from "@/domain/labels";
import { allowedDocumentKinds } from "@/lib/compliance";
import type { ActionResult } from "@/lib/actions/result";
import { updateCompanySettingsAction } from "@/app/(app)/configuracoes/actions";

const councilOptions = toOptions(councilTypeLabels);

export type CompanySettingsValues = {
  name: string;
  legalName: string | null;
  document: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  website: string | null;
  addressLine: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  professionalName: string | null;
  professionalTitle: string | null;
  councilType: string;
  councilNumber: string | null;
  canIssueArt: boolean;
  defaultBdiPercent: number;
  defaultValidityDays: number;
  defaultPaymentTerms: string | null;
  proposalFooterNotes: string | null;
  reportFooterNotes: string | null;
};

/**
 * Configurações da empresa.
 *
 * O bloco de habilitação profissional não é burocracia de cadastro: é o que
 * decide quais documentos o sistema aceita emitir. Por isso a prévia de tipos
 * liberados fica ao lado dos campos, atualizando conforme se preenche.
 */
export function CompanyForm({ defaults }: { defaults: CompanySettingsValues }) {
  const { toast } = useToast();
  const [state, formAction] = useActionState<ActionResult<unknown> | null, FormData>(
    updateCompanySettingsAction,
    null,
  );

  const [councilType, setCouncilType] = useState(defaults.councilType);
  const [councilNumber, setCouncilNumber] = useState(defaults.councilNumber ?? "");

  useEffect(() => {
    if (state?.ok && state.message) toast(state.message);
  }, [state, toast]);

  const errors = state && !state.ok ? state.fieldErrors : undefined;
  const generalError = state && !state.ok && !state.fieldErrors ? state.error : null;

  const registered = councilType !== CouncilType.NENHUM && councilNumber.trim() !== "";
  const kinds = allowedDocumentKinds({
    professionalName: defaults.professionalName,
    professionalTitle: defaults.professionalTitle,
    councilType,
    councilNumber: councilNumber.trim() === "" ? null : councilNumber,
    canIssueArt: defaults.canIssueArt,
  });

  return (
    <form action={formAction} className="space-y-8" noValidate>
      <FormError message={generalError} />

      <FieldGroup title="Empresa" description="Aparece em propostas, relatórios e no rodapé do site.">
        <Field label="Nome" htmlFor="name" error={errors?.name} required>
          <Input id="name" name="name" defaultValue={defaults.name} invalid={Boolean(errors?.name)} />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Razão social" htmlFor="legalName" error={errors?.legalName}>
            <Input id="legalName" name="legalName" defaultValue={defaults.legalName ?? ""} />
          </Field>
          <Field label="CNPJ ou CPF" htmlFor="document" error={errors?.document}>
            <Input id="document" name="document" defaultValue={defaults.document ?? ""} />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="E-mail" htmlFor="email" error={errors?.email}>
            <Input id="email" name="email" type="email" defaultValue={defaults.email ?? ""} />
          </Field>
          <Field label="Site" htmlFor="website" error={errors?.website}>
            <Input id="website" name="website" defaultValue={defaults.website ?? ""} />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Telefone" htmlFor="phone" error={errors?.phone}>
            <Input id="phone" name="phone" type="tel" defaultValue={defaults.phone ?? ""} />
          </Field>
          <Field label="WhatsApp" htmlFor="whatsapp" error={errors?.whatsapp}>
            <Input id="whatsapp" name="whatsapp" type="tel" defaultValue={defaults.whatsapp ?? ""} />
          </Field>
        </div>

        <Field label="Endereço" htmlFor="addressLine" error={errors?.addressLine}>
          <Input id="addressLine" name="addressLine" defaultValue={defaults.addressLine ?? ""} />
        </Field>

        <div className="grid grid-cols-4 gap-4">
          <Field label="Cidade" htmlFor="city" error={errors?.city} className="col-span-2">
            <Input id="city" name="city" defaultValue={defaults.city ?? ""} />
          </Field>
          <Field label="UF" htmlFor="state" error={errors?.state}>
            <Input id="state" name="state" maxLength={2} defaultValue={defaults.state ?? ""} />
          </Field>
          <Field label="CEP" htmlFor="zipCode" error={errors?.zipCode}>
            <Input id="zipCode" name="zipCode" defaultValue={defaults.zipCode ?? ""} />
          </Field>
        </div>
      </FieldGroup>

      <FieldGroup
        title="Habilitação profissional"
        description="Define quais documentos o sistema aceita emitir."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Responsável técnico" htmlFor="professionalName" error={errors?.professionalName}>
            <Input
              id="professionalName"
              name="professionalName"
              defaultValue={defaults.professionalName ?? ""}
              placeholder="Nome de quem assina"
            />
          </Field>
          <Field label="Título" htmlFor="professionalTitle" error={errors?.professionalTitle}>
            <Input
              id="professionalTitle"
              name="professionalTitle"
              defaultValue={defaults.professionalTitle ?? ""}
              placeholder="Engenheiro civil, arquiteto, técnico…"
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Conselho" htmlFor="councilType" error={errors?.councilType}>
            <Select
              id="councilType"
              name="councilType"
              options={councilOptions}
              value={councilType}
              onChange={(event) => setCouncilType(event.target.value)}
            />
          </Field>
          <Field label="Número de registro" htmlFor="councilNumber" error={errors?.councilNumber}>
            <Input
              id="councilNumber"
              name="councilNumber"
              value={councilNumber}
              onChange={(event) => setCouncilNumber(event.target.value)}
              disabled={councilType === CouncilType.NENHUM}
              placeholder={councilType === CouncilType.NENHUM ? "Selecione o conselho" : "0000000000"}
            />
          </Field>
        </div>

        {councilType !== CouncilType.NENHUM ? (
          <Checkbox
            name="canIssueArt"
            label="Recolho ART/RRT para os serviços que exigem"
            description="Sem isso, documentos que dependem de ART continuam com aviso de verificação."
            defaultChecked={defaults.canIssueArt}
          />
        ) : null}

        <div
          className={`rounded-control border px-3.5 py-3 ${
            registered ? "border-success/25 bg-success-soft" : "border-warning/25 bg-warning-soft"
          }`}
        >
          <p
            className={`flex items-center gap-2 text-sm font-medium ${
              registered ? "text-success" : "text-warning"
            }`}
          >
            {registered ? (
              <ShieldCheck className="size-4 shrink-0" />
            ) : (
              <TriangleAlert className="size-4 shrink-0" />
            )}
            {registered
              ? "Registro em conselho configurado"
              : "Sem registro em conselho configurado"}
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-ink-700">
            {registered
              ? "Laudos e pareceres técnicos ficam disponíveis. Confirme o recolhimento de ART/RRT antes de entregar."
              : "Documentos que exigem habilitação (laudo técnico, parecer, inspeção predial) ficam bloqueados e são emitidos como relatório de vistoria."}
          </p>
          <p className="mt-2 text-xs text-ink-500">
            Disponíveis agora: {kinds.map((kind) => documentKindLabels[kind]).join(" · ")}
          </p>
        </div>
      </FieldGroup>

      <FieldGroup title="Padrões comerciais">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="BDI padrão (%)" htmlFor="defaultBdiPercent" error={errors?.defaultBdiPercent}>
            <Input
              id="defaultBdiPercent"
              name="defaultBdiPercent"
              inputMode="decimal"
              defaultValue={String(defaults.defaultBdiPercent)}
              className="tabular"
            />
          </Field>
          <Field
            label="Validade da proposta (dias)"
            htmlFor="defaultValidityDays"
            error={errors?.defaultValidityDays}
          >
            <Input
              id="defaultValidityDays"
              name="defaultValidityDays"
              inputMode="numeric"
              defaultValue={String(defaults.defaultValidityDays)}
              className="tabular"
            />
          </Field>
        </div>

        <Field
          label="Condições de pagamento padrão"
          htmlFor="defaultPaymentTerms"
          error={errors?.defaultPaymentTerms}
        >
          <Textarea
            id="defaultPaymentTerms"
            name="defaultPaymentTerms"
            rows={2}
            defaultValue={defaults.defaultPaymentTerms ?? ""}
          />
        </Field>

        <Field
          label="Observação no rodapé da proposta"
          htmlFor="proposalFooterNotes"
          error={errors?.proposalFooterNotes}
        >
          <Textarea
            id="proposalFooterNotes"
            name="proposalFooterNotes"
            rows={2}
            defaultValue={defaults.proposalFooterNotes ?? ""}
          />
        </Field>

        <Field
          label="Observação no rodapé do relatório"
          htmlFor="reportFooterNotes"
          error={errors?.reportFooterNotes}
        >
          <Textarea
            id="reportFooterNotes"
            name="reportFooterNotes"
            rows={2}
            defaultValue={defaults.reportFooterNotes ?? ""}
          />
        </Field>
      </FieldGroup>

      <div className="flex justify-end">
        <SubmitButton pendingLabel="Salvando…">Salvar configurações</SubmitButton>
      </div>
    </form>
  );
}
