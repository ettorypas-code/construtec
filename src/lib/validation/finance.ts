import { z } from "zod";
import { ExpenseCategory, PaymentMethod } from "@/domain/enums";
import {
  enumField,
  moneyField,
  optionalId,
  optionalLongText,
  optionalText,
  requiredDate,
  requiredId,
  requiredText,
} from "./common";

export const paymentSchema = z.object({
  description: requiredText("Descreva o recebimento", 200),
  clientId: optionalId,
  projectId: optionalId,
  amountCents: moneyField("Informe o valor"),
  dueDate: requiredDate("Informe o vencimento"),
  notes: optionalLongText(),
});

export const expenseSchema = z.object({
  description: requiredText("Descreva a despesa", 200),
  category: enumField(ExpenseCategory),
  supplier: optionalText(160),
  projectId: optionalId,
  amountCents: moneyField("Informe o valor"),
  dueDate: requiredDate("Informe o vencimento"),
  notes: optionalLongText(),
});

export const settlePaymentSchema = z.object({
  id: requiredId,
  method: enumField(PaymentMethod),
});

export const settleExpenseSchema = z.object({ id: requiredId });
