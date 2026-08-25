import { z } from "zod";
import { CouncilType } from "@/domain/enums";
import {
  checkboxField,
  enumField,
  optionalEmail,
  optionalLongText,
  optionalPhone,
  optionalText,
  percentField,
  requiredText,
} from "./common";

export const companySettingsSchema = z.object({
  name: requiredText("Informe o nome da empresa", 160),
  legalName: optionalText(200),
  document: optionalText(30),
  email: optionalEmail,
  phone: optionalPhone,
  whatsapp: optionalPhone,
  website: optionalText(160),
  addressLine: optionalText(200),
  city: optionalText(80),
  state: optionalText(2),
  zipCode: optionalText(12),

  // Habilitação profissional — alimenta a guarda de terminologia.
  professionalName: optionalText(160),
  professionalTitle: optionalText(120),
  councilType: enumField(CouncilType),
  councilNumber: optionalText(40),
  canIssueArt: checkboxField,

  defaultBdiPercent: percentField,
  defaultValidityDays: z
    .string()
    .trim()
    .transform((value) => (value === "" ? 15 : Number(value)))
    .refine((value) => Number.isInteger(value) && value > 0 && value <= 365, "Entre 1 e 365 dias"),
  defaultPaymentTerms: optionalLongText(1000),
  proposalFooterNotes: optionalLongText(1000),
  reportFooterNotes: optionalLongText(1000),
});

export type CompanySettingsInput = z.infer<typeof companySettingsSchema>;
