import "server-only";

import { unstable_rethrow } from "next/navigation";
import { z } from "zod";
import { getCurrentUser, type CurrentUser } from "@/lib/auth/guards";
import { UserRole } from "@/domain/enums";
import { actionError, actionSuccess, BusinessError, type ActionResult } from "./result";

/**
 * Fábrica de server actions.
 *
 * Padroniza os quatro passos que toda mutação precisa fazer, na mesma ordem:
 *   1. validar a entrada com Zod
 *   2. autenticar e autorizar
 *   3. executar a regra de negócio
 *   4. devolver `ActionResult`, nunca uma exceção
 *
 * A assinatura resultante é compatível com `useActionState`.
 */

type Handler<TInput, TOutput> = (
  input: TInput,
  context: { user: CurrentUser },
) => Promise<TOutput>;

type PublicHandler<TInput, TOutput> = (input: TInput) => Promise<TOutput>;

/**
 * `previousState` é `unknown` de propósito: o helper nunca lê o estado
 * anterior. Tipá-lo como `ActionResult<TOutput>` tornaria a action invariante
 * e impediria que um formulário genérico aceitasse ações de módulos
 * diferentes, sem ganho nenhum de segurança.
 */
export type FormAction<TOutput> = (
  previousState: unknown,
  formData: FormData,
) => Promise<ActionResult<TOutput>>;

const AUTH_ERROR = "Sessão expirada. Entre novamente para continuar.";
const GENERIC_ERROR = "Algo deu errado. Tente novamente.";

/** Action autenticada, recebendo FormData. */
export function formAction<TSchema extends z.ZodType, TOutput>(config: {
  schema: TSchema;
  roles?: UserRole[];
  handler: Handler<z.output<TSchema>, TOutput>;
  successMessage?: string;
}): FormAction<TOutput> {
  return async (_previousState, formData) => {
    const parsed = config.schema.safeParse(formDataToObject(formData));
    if (!parsed.success) {
      return actionError("Confira os campos destacados.", toFieldErrors(parsed.error));
    }

    const user = await getCurrentUser();
    if (!user) return actionError(AUTH_ERROR);

    const allowedRoles = config.roles ?? [UserRole.ADMIN];
    if (!allowedRoles.includes(user.role)) {
      return actionError("Você não tem permissão para esta ação.");
    }

    return run(() => config.handler(parsed.data, { user }), config.successMessage);
  };
}

/** Action pública (captação de lead na landing page). Sem sessão. */
export function publicFormAction<TSchema extends z.ZodType, TOutput>(config: {
  schema: TSchema;
  handler: PublicHandler<z.output<TSchema>, TOutput>;
  successMessage?: string;
}): FormAction<TOutput> {
  return async (_previousState, formData) => {
    const parsed = config.schema.safeParse(formDataToObject(formData));
    if (!parsed.success) {
      return actionError("Confira os campos destacados.", toFieldErrors(parsed.error));
    }
    return run(() => config.handler(parsed.data), config.successMessage);
  };
}

/**
 * Action autenticada chamada diretamente com um objeto (não via `<form>`).
 * Usada por interações pontuais: marcar item do checklist, arrastar lead,
 * concluir tarefa.
 */
export function objectAction<TSchema extends z.ZodType, TOutput>(config: {
  schema: TSchema;
  roles?: UserRole[];
  handler: Handler<z.output<TSchema>, TOutput>;
  successMessage?: string;
}): (input: z.input<TSchema>) => Promise<ActionResult<TOutput>> {
  return async (input) => {
    const parsed = config.schema.safeParse(input);
    if (!parsed.success) {
      return actionError("Dados inválidos.", toFieldErrors(parsed.error));
    }

    const user = await getCurrentUser();
    if (!user) return actionError(AUTH_ERROR);

    const allowedRoles = config.roles ?? [UserRole.ADMIN];
    if (!allowedRoles.includes(user.role)) {
      return actionError("Você não tem permissão para esta ação.");
    }

    return run(() => config.handler(parsed.data, { user }), config.successMessage);
  };
}

/* -------------------------------------------------------------------------- */

async function run<TOutput>(
  execute: () => Promise<TOutput>,
  successMessage?: string,
): Promise<ActionResult<TOutput>> {
  try {
    const data = await execute();
    return actionSuccess(data, successMessage);
  } catch (error) {
    // `redirect()` e `notFound()` sinalizam por exceção: precisam subir.
    unstable_rethrow(error);

    if (error instanceof BusinessError) {
      return actionError(error.message, error.fieldErrors);
    }

    console.error("[action]", error);
    return actionError(GENERIC_ERROR);
  }
}

/**
 * FormData → objeto simples.
 * Campos repetidos viram array (checkbox múltiplo); `File` é descartado, pois
 * upload passa por `/api/upload`, não por server action.
 */
function formDataToObject(formData: FormData): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, value] of formData.entries()) {
    if (value instanceof File) continue;

    const existing = result[key];
    if (existing === undefined) {
      result[key] = value;
    } else if (Array.isArray(existing)) {
      existing.push(value);
    } else {
      result[key] = [existing, value];
    }
  }

  return result;
}

function toFieldErrors(error: z.ZodError): Record<string, string> {
  const flattened = z.flattenError(error);
  const fieldErrors: Record<string, string> = {};

  for (const [field, messages] of Object.entries(flattened.fieldErrors)) {
    const first = (messages as string[] | undefined)?.[0];
    if (first) fieldErrors[field] = first;
  }

  return fieldErrors;
}
