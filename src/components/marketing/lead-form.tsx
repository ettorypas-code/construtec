"use client";

import { useActionState } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Field, Input, Textarea } from "@/components/ui/form";
import { FormError } from "@/components/ui/states";
import { SubmitButton } from "@/components/ui/submit-button";
import type { ActionResult } from "@/lib/actions/result";
import { submitPublicLeadAction } from "@/app/(public)/actions";

/**
 * Formulário de captação.
 *
 * Três campos e um aceite. Cada campo a mais aqui é conversão perdida — o resto
 * das informações se coleta na ligação, que é justamente o objetivo do envio.
 */
export function LeadForm({
  serviceCode,
  origin,
  submitLabel = "Quero agendar",
}: {
  serviceCode: string;
  origin: string;
  submitLabel?: string;
}) {
  const [state, formAction] = useActionState<ActionResult<unknown> | null, FormData>(
    submitPublicLeadAction,
    null,
  );

  if (state?.ok) {
    return (
      <div className="flex items-start gap-3 rounded-card border border-success/25 bg-success-soft p-5">
        <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" />
        <div>
          <p className="font-medium text-ink-900">Pedido recebido</p>
          <p className="mt-1 text-sm text-ink-600">
            Vou entrar em contato pelo WhatsApp para confirmar o dia e o horário.
          </p>
        </div>
      </div>
    );
  }

  const errors = state && !state.ok ? state.fieldErrors : undefined;
  // Sempre visível quando a ação falha. Mostrar só erros por campo esconde a
  // falha inteira quando o campo culpado não está renderizado na tela.
  const generalError = state && !state.ok ? state.error : null;

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <input type="hidden" name="serviceCode" value={serviceCode} />
      <input type="hidden" name="origin" value={origin} />

      <FormError message={generalError} />

      <Field label="Seu nome" htmlFor="lead-name" error={errors?.name} required>
        <Input
          id="lead-name"
          name="name"
          autoComplete="name"
          placeholder="Como devo te chamar"
          invalid={Boolean(errors?.name)}
        />
      </Field>

      <Field label="WhatsApp" htmlFor="lead-phone" error={errors?.phone} required>
        <Input
          id="lead-phone"
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="(11) 90000-0000"
          invalid={Boolean(errors?.phone)}
        />
      </Field>

      <Field label="E-mail" htmlFor="lead-email" error={errors?.email} hint="Opcional.">
        <Input
          id="lead-email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="voce@email.com"
          invalid={Boolean(errors?.email)}
        />
      </Field>

      <Field
        label="Conte um pouco"
        htmlFor="lead-message"
        error={errors?.message}
        hint="Empreendimento, unidade, metragem, data prevista de entrega."
      >
        <Textarea
          id="lead-message"
          name="message"
          rows={3}
          placeholder="Recebo as chaves do apto 1204 no Residencial Aurora em novembro. 65 m²."
        />
      </Field>

      <label className="flex cursor-pointer items-start gap-2.5">
        <input
          type="checkbox"
          name="consent"
          value="on"
          className="mt-0.5 size-4 shrink-0 rounded border-ink-300 accent-brand-600"
        />
        <span className="text-xs leading-relaxed text-ink-600">
          Autorizo o contato pelos dados informados e o tratamento deles para atendimento
          desta solicitação, conforme a{" "}
          <Link href="/privacidade" className="text-brand-600 underline-offset-2 hover:underline">
            política de privacidade
          </Link>
          .
        </span>
      </label>
      {errors?.consent ? <p className="text-sm text-danger">{errors.consent}</p> : null}

      <SubmitButton fullWidth size="lg" pendingLabel="Enviando…">
        {submitLabel}
      </SubmitButton>
    </form>
  );
}
