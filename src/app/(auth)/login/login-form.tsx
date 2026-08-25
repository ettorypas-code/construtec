"use client";

import { useActionState } from "react";
import { Field, Input } from "@/components/ui/form";
import { FormError } from "@/components/ui/states";
import { SubmitButton } from "@/components/ui/submit-button";
import type { ActionResult } from "@/lib/actions/result";
import { loginAction } from "./actions";

export function LoginForm({ redirectTo }: { redirectTo?: string }) {
  const [state, formAction] = useActionState<ActionResult<never> | null, FormData>(
    loginAction,
    null,
  );

  const fieldErrors = state && !state.ok ? state.fieldErrors : undefined;
  const generalError =
    state && !state.ok && !state.fieldErrors ? state.error : null;

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {redirectTo ? <input type="hidden" name="redirectTo" value={redirectTo} /> : null}

      <FormError message={generalError} />

      <Field label="E-mail" htmlFor="email" error={fieldErrors?.email}>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          autoFocus
          placeholder="voce@empresa.com.br"
          invalid={Boolean(fieldErrors?.email)}
        />
      </Field>

      <Field label="Senha" htmlFor="password" error={fieldErrors?.password}>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          invalid={Boolean(fieldErrors?.password)}
        />
      </Field>

      <SubmitButton fullWidth size="lg" pendingLabel="Entrando…">
        Entrar
      </SubmitButton>
    </form>
  );
}
