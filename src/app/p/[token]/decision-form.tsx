"use client";

import { useActionState, useState } from "react";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/ui/states";
import { SubmitButton } from "@/components/ui/submit-button";
import type { ActionResult } from "@/lib/actions/result";
import { decideProposalAction } from "./actions";

/**
 * Aceite ou recusa pelo cliente.
 *
 * Recusar exige confirmação; aceitar não. A assimetria é proposital: aceitar é
 * o caminho desejado e reversível por contato, enquanto recusar por engano
 * encerra a negociação do lado do cliente.
 */
export function DecisionForm({ token }: { token: string }) {
  const [confirmingDecline, setConfirmingDecline] = useState(false);
  const [state, formAction] = useActionState<ActionResult<unknown> | null, FormData>(
    decideProposalAction,
    null,
  );

  const error = state && !state.ok ? state.error : null;

  return (
    <div className="space-y-3">
      <FormError message={error} />

      <form action={formAction} className="flex flex-col gap-2 sm:flex-row">
        <input type="hidden" name="token" value={token} />

        <SubmitButton
          name="decision"
          value="aceitar"
          size="lg"
          className="flex-1"
          pendingLabel="Registrando…"
        >
          <Check className="size-5" />
          Aceitar proposta
        </SubmitButton>

        {confirmingDecline ? (
          <SubmitButton
            name="decision"
            value="recusar"
            variant="danger"
            size="lg"
            className="flex-1"
            pendingLabel="Registrando…"
          >
            Confirmar recusa
          </SubmitButton>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="flex-1"
            onClick={() => setConfirmingDecline(true)}
          >
            <X className="size-5" />
            Recusar
          </Button>
        )}
      </form>

      {confirmingDecline ? (
        <button
          type="button"
          onClick={() => setConfirmingDecline(false)}
          className="text-sm text-ink-500 underline-offset-2 hover:underline"
        >
          Cancelar recusa
        </button>
      ) : null}
    </div>
  );
}
