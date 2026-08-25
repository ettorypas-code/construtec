import { z } from "zod";
import {
  ChecklistItemStatus,
  DocumentKind,
  FindingCategory,
  FindingStatus,
  Severity,
} from "@/domain/enums";
import {
  enumField,
  optionalDate,
  optionalEnumField,
  optionalId,
  optionalLongText,
  optionalPhone,
  optionalText,
  requiredId,
  requiredText,
} from "./common";

export const inspectionSchema = z.object({
  title: requiredText("Informe um título para a vistoria", 160),
  clientId: optionalId,
  propertyId: optionalId,
  serviceTypeId: optionalId,
  templateId: optionalId,
  scheduledAt: optionalDate,
  documentKind: enumField(DocumentKind),
  contactName: optionalText(120),
  contactPhone: optionalPhone,
  notes: optionalLongText(),
});

export const finishInspectionSchema = z.object({
  id: requiredId,
  summaryText: optionalLongText(3000),
});

/**
 * Marcação de item do checklist.
 *
 * Carrega `inspectionId` e `roomId` porque a action precisa revalidar a rota do
 * ambiente: sem isso, a marcação otimista reverte assim que a transição termina,
 * já que o componente servidor continuaria com o estado antigo.
 */
export const checklistItemSchema = z.object({
  itemId: requiredId,
  inspectionId: requiredId,
  roomId: requiredId,
  status: enumField(ChecklistItemStatus),
});

export const checklistItemNotesSchema = z.object({
  itemId: requiredId,
  inspectionId: requiredId,
  roomId: requiredId,
  notes: optionalText(500),
});

export const newChecklistItemSchema = z.object({
  inspectionId: requiredId,
  roomId: requiredId,
  label: requiredText("Informe o nome do item", 120),
  category: optionalEnumField(FindingCategory),
});

export const removeChecklistItemSchema = z.object({
  itemId: requiredId,
  inspectionId: requiredId,
  roomId: requiredId,
});

/** Fotos já enviadas a /api/upload, anexadas a um item do checklist. */
export const itemPhotosSchema = z.object({
  itemId: requiredId,
  inspectionId: requiredId,
  roomId: requiredId,
  keys: z
    .union([z.string(), z.array(z.string())])
    .transform((value) => (Array.isArray(value) ? value.filter(Boolean) : [value]))
    .refine((keys) => keys.length > 0, "Nenhuma foto enviada"),
});

export const roomSchema = z.object({
  inspectionId: requiredId,
  name: requiredText("Informe o nome do ambiente", 80),
});

/**
 * Criação de ocorrência.
 *
 * `mediaKeys` chega como campo repetido do formulário (uma entrada por foto já
 * enviada a `/api/upload`), então aceita string única ou array.
 */
export const findingSchema = z.object({
  inspectionId: requiredId,
  roomId: optionalId,
  category: enumField(FindingCategory),
  title: requiredText("Descreva o problema em poucas palavras", 160),
  description: optionalLongText(2000),
  severity: enumField(Severity),
  locationNote: optionalText(160),
  libraryId: optionalId,
  mediaKeys: z
    .union([z.string(), z.array(z.string()), z.undefined()])
    .transform((value) => {
      if (value === undefined || value === "") return [];
      return Array.isArray(value) ? value.filter(Boolean) : [value];
    }),
});

export const findingUpdateSchema = z.object({
  id: requiredId,
  category: enumField(FindingCategory),
  title: requiredText("Descreva o problema", 160),
  description: optionalLongText(2000),
  severity: enumField(Severity),
  status: enumField(FindingStatus),
  locationNote: optionalText(160),
});

export const findingStatusSchema = z.object({
  id: requiredId,
  status: enumField(FindingStatus),
});
