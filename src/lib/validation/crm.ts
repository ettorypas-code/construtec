import { z } from "zod";
import {
  ClientKind,
  ContactChannel,
  LeadSource,
  LeadStatus,
  PropertyKind,
} from "@/domain/enums";
import {
  checkboxField,
  enumField,
  optionalDate,
  optionalEmail,
  optionalId,
  optionalLongText,
  optionalMoneyField,
  optionalPhone,
  optionalQuantity,
  optionalText,
  requiredId,
  requiredText,
} from "./common";

/* ------------------------------- Leads ----------------------------------- */

export const leadSchema = z.object({
  name: requiredText("Informe o nome do contato", 160),
  phone: optionalPhone,
  whatsapp: optionalPhone,
  email: optionalEmail,
  source: enumField(LeadSource),
  serviceTypeId: optionalId,
  serviceNote: optionalText(300),
  potentialValueCents: optionalMoneyField,
  status: enumField(LeadStatus),
  notes: optionalLongText(),
  nextContactAt: optionalDate,
});

export type LeadInput = z.infer<typeof leadSchema>;

export const leadUpdateSchema = leadSchema.extend({
  id: requiredId,
  lostReason: optionalText(300),
});

export const leadStatusSchema = z.object({
  id: requiredId,
  status: enumField(LeadStatus),
  lostReason: optionalText(300),
});

export const leadActivitySchema = z.object({
  leadId: requiredId,
  channel: enumField(ContactChannel),
  summary: requiredText("Descreva o contato", 500),
  outcome: optionalText(300),
  nextContactAt: optionalDate,
});

export const leadConvertSchema = z.object({
  leadId: requiredId,
  kind: enumField(ClientKind),
  document: optionalText(30),
  addressLine: optionalText(200),
  city: optionalText(80),
  state: optionalText(2),
});

/** Formulário público da landing page. Menos campos, e consentimento explícito. */
export const publicLeadSchema = z.object({
  name: requiredText("Informe seu nome", 160),
  phone: z
    .string()
    .trim()
    .transform((value) => value.replace(/\D/g, ""))
    .refine((value) => value.length >= 10 && value.length <= 13, "Informe um telefone válido"),
  email: optionalEmail,
  serviceCode: optionalText(40),
  message: optionalLongText(1500),
  consent: checkboxField.refine((value) => value, "É preciso aceitar para continuar"),
  /** Preenchido pela página que originou o envio, para saber o que converte. */
  origin: optionalText(80),
});

export type PublicLeadInput = z.infer<typeof publicLeadSchema>;

/* ------------------------------ Clientes --------------------------------- */

export const clientSchema = z.object({
  kind: enumField(ClientKind),
  name: requiredText("Informe o nome", 160),
  document: optionalText(30),
  email: optionalEmail,
  phone: optionalPhone,
  whatsapp: optionalPhone,
  addressLine: optionalText(200),
  district: optionalText(80),
  city: optionalText(80),
  state: optionalText(2),
  zipCode: optionalText(12),
  notes: optionalLongText(),
});

export const clientUpdateSchema = clientSchema.extend({ id: requiredId });

/* ------------------------------- Imóveis --------------------------------- */

export const propertySchema = z.object({
  clientId: optionalId,
  kind: enumField(PropertyKind),
  development: optionalText(120),
  tower: optionalText(40),
  unit: optionalText(40),
  addressLine: optionalText(200),
  district: optionalText(80),
  city: optionalText(80),
  state: optionalText(2),
  zipCode: optionalText(12),
  areaSqm: optionalQuantity,
  notes: optionalLongText(),
});

export const propertyUpdateSchema = propertySchema.extend({ id: requiredId });
