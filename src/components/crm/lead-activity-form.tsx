"use client";

import { useActionState, useEffect, useRef } from "react";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { FormError } from "@/components/ui/states";
import { SubmitButton } from "@/components/ui/submit-button";
import { useToast } from "@/components/ui/toast";
import { ContactChannel } from "@/domain/enums";
import { contactChannelLabels, toOptions } from "@/domain/labels";
import type { ActionResult } from "@/lib/actions/result";
import { addLeadActivityAction } from "@/app/(app)/crm/actions";

const channelOptions = toOptions(contactChannelLabels);

/**
 * Registro de contato.
 *
 * Além de gravar o histórico, mover o lead de "Novo" para "Contato realizado"
 * acontece no serviço, sem o usuário precisar lembrar de mexer no estágio.
 */
export function LeadActivityForm({ leadId }: { leadId: string }) {
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction] = useActionState<ActionResult<unknown> | null, FormData>(
    addLeadActivityAction,
    null,
  );

  useEffect(() => {
    if (state?.ok) {
      toast(state.message ?? "Contato registrado.");
      formRef.current?.reset();
    }
  }, [state, toast]);

  const errors = state && !state.ok ? state.fieldErrors : undefined;
  // Sempre visível quando a ação falha. Mostrar só erros por campo esconde a
  // falha inteira quando o campo culpado não está renderizado na tela.
  const generalError = state && !state.ok ? state.error : null;

  return (
    <form ref={formRef} action={formAction} className="space-y-4" noValidate>
      <input type="hidden" name="leadId" value={leadId} />

      <FormError message={generalError} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Canal" htmlFor="channel" error={errors?.channel}>
          <Select
            id="channel"
            name="channel"
            options={channelOptions}
            defaultValue={ContactChannel.WHATSAPP}
          />
        </Field>

        <Field
          label="Próximo contato"
          htmlFor="nextContactAt"
          error={errors?.nextContactAt}
          hint="Deixe vazio se não precisa retornar."
        >
          <Input id="nextContactAt" name="nextContactAt" type="date" />
        </Field>
      </div>

      <Field label="O que aconteceu" htmlFor="summary" error={errors?.summary} required>
        <Textarea
          id="summary"
          name="summary"
          rows={2}
          placeholder="Ligação atendida, explicou que recebe as chaves em novembro…"
          invalid={Boolean(errors?.summary)}
        />
      </Field>

      <div className="flex justify-end">
        <SubmitButton size="sm" pendingLabel="Registrando…">
          Registrar contato
        </SubmitButton>
      </div>
    </form>
  );
}
