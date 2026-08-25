import { z } from "zod";
import { BudgetStatus, ProjectKind, Unit } from "@/domain/enums";
import {
  enumField,
  moneyField,
  optionalEnumField,
  optionalQuantity,
  optionalDate,
  optionalId,
  optionalLongText,
  optionalMoneyField,
  optionalText,
  percentField,
  quantityField,
  requiredId,
  requiredText,
} from "./common";

/* ------------------------------ Orçamento -------------------------------- */

export const budgetSchema = z.object({
  name: requiredText("Dê um nome ao orçamento", 160),
  clientId: optionalId,
  projectId: optionalId,
  serviceTypeId: optionalId,
  projectKind: optionalEnumField(ProjectKind),
  areaSqm: optionalQuantity,
  addressLine: optionalText(200),
  city: optionalText(80),
  reference: optionalText(160),
  deadlineText: optionalText(200),
  bdiPercent: percentField,
  status: enumField(BudgetStatus),
  notes: optionalLongText(),
});

export const budgetUpdateSchema = budgetSchema.extend({ id: requiredId });

export const budgetItemSchema = z.object({
  budgetId: requiredId,
  groupName: optionalText(80),
  code: optionalText(40),
  description: requiredText("Descreva o serviço", 300),
  unit: enumField(Unit),
  quantity: quantityField(),
  materialUnitCents: optionalMoneyField,
  laborUnitCents: optionalMoneyField,
  equipmentUnitCents: optionalMoneyField,
  wastePercent: percentField,
  /** Vazio herda o BDI do orçamento. */
  bdiPercent: z
    .string()
    .trim()
    .transform((value) => (value === "" ? null : Number(value.replace(",", "."))))
    .refine(
      (value) => value === null || (Number.isFinite(value) && value >= 0 && value <= 100),
      "Informe um BDI entre 0 e 100",
    ),
});

export const budgetItemUpdateSchema = budgetItemSchema.extend({ id: requiredId });

/* ------------------------------- Proposta -------------------------------- */

export const proposalSchema = z.object({
  title: requiredText("Dê um título à proposta", 160),
  clientId: optionalId,
  leadId: optionalId,
  serviceTypeId: optionalId,
  budgetId: optionalId,
  scopeText: optionalLongText(6000),
  exclusionsText: optionalLongText(3000),
  deadlineText: optionalText(300),
  paymentTerms: optionalLongText(1000),
  notes: optionalLongText(2000),
  discountCents: optionalMoneyField,
  validUntil: optionalDate,
});

export const proposalUpdateSchema = proposalSchema.extend({ id: requiredId });

export const proposalItemSchema = z.object({
  proposalId: requiredId,
  description: requiredText("Descreva o item", 300),
  detail: optionalText(500),
  unit: enumField(Unit),
  quantity: quantityField(),
  unitPriceCents: moneyField(),
});

export const proposalItemUpdateSchema = proposalItemSchema
  .omit({ proposalId: true })
  .extend({ id: requiredId });
