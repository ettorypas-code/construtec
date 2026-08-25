import { z } from "zod";
import { parseBRLToCents, parseQuantity } from "@/lib/utils/money";

/**
 * Peças reutilizáveis de validação.
 *
 * Formulários HTML mandam tudo como string — inclusive campo vazio, que chega
 * como `""` e não como `undefined`. Estes helpers absorvem essa diferença uma
 * vez, para que nenhum schema de módulo precise repetir a mesma conversão.
 */

/** Texto obrigatório, já aparado. */
export function requiredText(message: string, max = 500) {
  return z.string().trim().min(1, message).max(max, `Máximo de ${max} caracteres`);
}

/** Texto opcional: `""` vira `null`. */
export function optionalText(max = 500) {
  return z
    .string()
    .trim()
    .max(max, `Máximo de ${max} caracteres`)
    .transform((value) => (value === "" ? null : value))
    .nullable()
    .default(null);
}

/** Texto longo opcional (observações, escopo, descrição). */
export function optionalLongText(max = 5000) {
  return optionalText(max);
}

export const emailField = z
  .string()
  .trim()
  .toLowerCase()
  .refine((value) => value === "" || z.email().safeParse(value).success, "E-mail inválido");

export const optionalEmail = emailField.transform((value) => (value === "" ? null : value));

export const requiredEmail = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "Informe o e-mail")
  .refine((value) => z.email().safeParse(value).success, "E-mail inválido");

/** Telefone brasileiro: aceita o que o usuário digitar, guarda só os dígitos. */
export const optionalPhone = z
  .string()
  .trim()
  .transform((value) => value.replace(/\D/g, ""))
  .refine((value) => value === "" || (value.length >= 10 && value.length <= 13), "Telefone inválido")
  .transform((value) => (value === "" ? null : value));

export const requiredPhone = z
  .string()
  .trim()
  .transform((value) => value.replace(/\D/g, ""))
  .refine((value) => value.length >= 10 && value.length <= 13, "Informe um telefone válido");

/** Campo monetário digitado em reais → centavos. */
export function moneyField(message = "Informe um valor válido") {
  return z
    .string()
    .trim()
    .refine((value) => parseBRLToCents(value) !== null, message)
    .transform((value) => parseBRLToCents(value) as number);
}

/** Campo monetário opcional → centavos ou `null`. */
export const optionalMoneyField = z
  .string()
  .trim()
  .transform((value) => (value === "" ? null : parseBRLToCents(value)))
  .refine((value) => value === null || Number.isFinite(value), "Valor inválido");

/** Quantidade decimal (m², m³, kg). */
export function quantityField(message = "Informe uma quantidade válida") {
  return z
    .string()
    .trim()
    .refine((value) => {
      const parsed = parseQuantity(value);
      return parsed !== null && parsed >= 0;
    }, message)
    .transform((value) => parseQuantity(value) as number);
}

export const optionalQuantity = z
  .string()
  .trim()
  .transform((value) => (value === "" ? null : parseQuantity(value)))
  .refine((value) => value === null || (Number.isFinite(value) && value >= 0), "Valor inválido");

/** Percentual 0–100. */
export const percentField = z
  .string()
  .trim()
  .transform((value) => (value === "" ? 0 : (parseQuantity(value) ?? 0)))
  .refine((value) => value >= 0 && value <= 100, "Informe um valor entre 0 e 100");

/** `<input type="date">` ou `datetime-local` → Date. */
export const optionalDate = z
  .string()
  .trim()
  .transform((value) => (value === "" ? null : new Date(value)))
  .refine((value) => value === null || !Number.isNaN(value.getTime()), "Data inválida");

export function requiredDate(message = "Informe a data") {
  return z
    .string()
    .trim()
    .min(1, message)
    .transform((value) => new Date(value))
    .refine((value) => !Number.isNaN(value.getTime()), "Data inválida");
}

/** Checkbox HTML: presente = "on"/"true", ausente = undefined. */
export const checkboxField = z
  .union([z.string(), z.boolean(), z.undefined()])
  .transform((value) => value === true || value === "on" || value === "true");

/** Referência opcional a outra entidade (select vazio → null). */
export const optionalId = z
  .string()
  .trim()
  .transform((value) => (value === "" ? null : value))
  .nullable()
  .default(null);

export const requiredId = z.string().trim().min(1, "Selecione uma opção");

/** Valor que precisa pertencer a um enum do domínio. */
export function enumField<T extends Record<string, string>>(
  values: T,
  message = "Opção inválida",
) {
  const allowed = Object.values(values) as [string, ...string[]];
  return z.enum(allowed, message).transform((value) => value as T[keyof T]);
}

export function optionalEnumField<T extends Record<string, string>>(values: T) {
  const allowed = Object.values(values) as string[];
  return z
    .string()
    .trim()
    .transform((value) => (value === "" ? null : value))
    .refine((value) => value === null || allowed.includes(value), "Opção inválida")
    .transform((value) => value as T[keyof T] | null);
}
