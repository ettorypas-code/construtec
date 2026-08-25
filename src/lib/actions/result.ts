/**
 * Formato único de retorno de toda server action.
 *
 * O componente cliente nunca precisa de try/catch: lê `result.ok` e pronto.
 * Erros de validação chegam por campo; erros de negócio chegam em `error`.
 */

export type FieldErrors = Record<string, string>;

export type ActionResult<T = null> =
  | { ok: true; data: T; message?: string }
  | { ok: false; error: string; fieldErrors?: FieldErrors };

export function actionSuccess(): ActionResult<null>;
export function actionSuccess<T>(data: T, message?: string): ActionResult<T>;
export function actionSuccess<T>(data?: T, message?: string): ActionResult<T | null> {
  return { ok: true, data: data ?? null, message };
}

export function actionError(error: string, fieldErrors?: FieldErrors): ActionResult<never> {
  return { ok: false, error, fieldErrors };
}

/**
 * Erro de negócio esperado (regra violada, não bug). O helper `action()`
 * converte isto em `{ ok: false }` em vez de deixar estourar como 500.
 */
export class BusinessError extends Error {
  readonly fieldErrors?: FieldErrors;

  constructor(message: string, fieldErrors?: FieldErrors) {
    super(message);
    this.name = "BusinessError";
    this.fieldErrors = fieldErrors;
  }
}
