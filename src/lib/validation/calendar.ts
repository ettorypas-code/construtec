import { z } from "zod";
import { EventStatus, EventType, TaskPriority } from "@/domain/enums";
import {
  checkboxField,
  enumField,
  optionalDate,
  optionalId,
  optionalLongText,
  optionalText,
  requiredDate,
  requiredId,
  requiredText,
} from "./common";

export const calendarEventSchema = z.object({
  type: enumField(EventType),
  title: requiredText("Informe o título do compromisso", 160),
  startsAt: requiredDate("Informe a data e a hora"),
  endsAt: optionalDate,
  allDay: checkboxField,
  status: enumField(EventStatus),
  clientId: optionalId,
  projectId: optionalId,
  address: optionalText(240),
  notes: optionalLongText(),
});

export const calendarEventUpdateSchema = calendarEventSchema.extend({ id: requiredId });

export const taskSchema = z.object({
  title: requiredText("Descreva a tarefa", 200),
  detail: optionalLongText(1000),
  dueAt: optionalDate,
  priority: enumField(TaskPriority),
});

export const taskToggleSchema = z.object({
  id: requiredId,
  done: z.union([z.boolean(), z.string()]).transform((value) => value === true || value === "true"),
});
