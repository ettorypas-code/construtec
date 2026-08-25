"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { CheckCircle2, MessageCircle } from "lucide-react";
import { Field, Input, Textarea } from "@/components/ui/form";
import { FormError } from "@/components/ui/states";
import { SubmitButton } from "@/components/ui/submit-button";
import type { ActionResult } from "@/lib/actions/result";
import { submitPublicLeadAction } from "@/app/(public)/actions";

/**
 * Formulário de captação.
 *
 * Três campos e um aceite. Cada campo a mais aqui é conversão perdida — o resto
 * das informações se coleta na conversa, que é justamente o objetivo do envio.
 *
 * O título fica dentro do componente, e não na seção que o contém, porque
 * depois do envio ele precisa sair junto: "Agendar vistoria" deixa de ser a
 * informação relevante quando o agendamento já foi pedido.
 */
export function LeadForm({
  serviceCode,
  origin,
  title,
  subtitle,
  submitLabel = "Quero agendar",
  whatsappNumber,
}: {
  serviceCode: string;
  origin: string;
  title: string;
  subtitle: string;
  submitLabel?: string;
  /** Só dígitos, sem o 55. Ausente, o atalho não aparece. */
  whatsappNumber?: string | null;
}) {
  // Guardado no envio para poder cumprimentar pelo nome na confirmação.
  const [nome, setNome] = useState("");

  const [state, formAction] = useActionState<ActionResult<unknown> | null, FormData>(
    submitPublicLeadAction,
    null,
  );

  if (state?.ok) {
    return <Confirmacao nome={nome} whatsappNumber={whatsappNumber} />;
  }

  const errors = state && !state.ok ? state.fieldErrors : undefined;
  // Sempre visível quando a ação falha, mesmo havendo erro de campo: uma falha
  // muda aqui é um cliente perdido sem que ninguém fique sabendo.
  const generalError = state && !state.ok ? state.error : null;

  return (
    <>
      <h2 className="text-base font-semibold tracking-tight text-ink-900">{title}</h2>
      <p className="mb-4 mt-1 text-sm text-ink-500">{subtitle}</p>

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
            value={nome}
            onChange={(event) => setNome(event.target.value)}
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
    </>
  );
}

/**
 * Confirmação de envio.
 *
 * O atalho de WhatsApp é a parte que importa. Quem acabou de enviar está com a
 * intenção no pico; mandar essa pessoa esperar por um retorno é onde o lead
 * esfria. Uma conversa começada agora vale muito mais do que um formulário na
 * fila — e o lead fica registrado no CRM de qualquer forma.
 */
function Confirmacao({
  nome,
  whatsappNumber,
}: {
  nome: string;
  whatsappNumber?: string | null;
}) {
  const primeiroNome = nome.trim().split(/\s+/)[0];
  const saudacao = primeiroNome ? `Recebi, ${primeiroNome}.` : "Pedido recebido.";

  const mensagem = encodeURIComponent(
    "Olá! Acabei de enviar meu pedido de vistoria pelo site.",
  );

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-success-soft text-success">
          <CheckCircle2 className="size-5" />
        </span>
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-ink-900">{saudacao}</h2>
          <p className="mt-1 text-sm leading-relaxed text-ink-600">
            Seu pedido chegou. Respondo pelo WhatsApp com as datas disponíveis e o valor
            fechado — normalmente ainda hoje, em horário comercial.
          </p>
        </div>
      </div>

      {whatsappNumber ? (
        <div className="rounded-control border border-success/25 bg-success-soft p-4">
          <p className="text-sm font-medium text-ink-900">Não quer esperar?</p>
          <p className="mt-1 text-sm leading-relaxed text-ink-600">
            Me chame agora e a gente já acerta o dia.
          </p>
          <a
            href={`https://wa.me/55${whatsappNumber}?text=${mensagem}`}
            target="_blank"
            rel="noreferrer noopener"
            className="mt-3 inline-flex h-11 items-center gap-2 rounded-control bg-success px-4 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            <MessageCircle className="size-4" />
            Falar no WhatsApp
          </a>
        </div>
      ) : null}

      <div className="rounded-control border border-ink-200 bg-paper p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
          Separe, se tiver
        </p>
        <ul className="mt-2 space-y-1.5 text-sm leading-relaxed text-ink-600">
          <li>· Memorial descritivo do imóvel</li>
          <li>· A data que a construtora marcou para a entrega</li>
          <li>· Metragem e número de ambientes</li>
        </ul>
        <p className="mt-2.5 text-xs text-ink-500">
          Nada disso é obrigatório — só deixa a vistoria mais precisa.
        </p>
      </div>
    </div>
  );
}
