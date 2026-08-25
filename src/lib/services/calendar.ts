import "server-only";

import { db } from "@/lib/db";
import { logActivity } from "@/lib/services/activity";
import { dayRange, monthRange, weekRange } from "@/lib/utils/dates";

export type CalendarView = "dia" | "semana" | "mes";

export type CalendarEventItem = {
  id: string;
  type: string;
  title: string;
  status: string;
  startsAt: Date;
  endsAt: Date | null;
  allDay: boolean;
  address: string | null;
  clientName: string | null;
  inspectionId: string | null;
  projectId: string | null;
};

/** Intervalo coberto pela visão escolhida. */
export function rangeForView(view: CalendarView, reference: Date) {
  switch (view) {
    case "dia":
      return dayRange(reference);
    case "semana":
      return weekRange(reference);
    case "mes":
      return monthRange(reference);
  }
}

export async function listEvents(start: Date, end: Date): Promise<CalendarEventItem[]> {
  const events = await db.calendarEvent.findMany({
    where: { startsAt: { gte: start, lte: end } },
    orderBy: { startsAt: "asc" },
    select: {
      id: true,
      type: true,
      title: true,
      status: true,
      startsAt: true,
      endsAt: true,
      allDay: true,
      address: true,
      inspectionId: true,
      projectId: true,
      client: { select: { name: true } },
    },
  });

  return events.map((event) => ({
    id: event.id,
    type: event.type,
    title: event.title,
    status: event.status,
    startsAt: event.startsAt,
    endsAt: event.endsAt,
    allDay: event.allDay,
    address: event.address,
    clientName: event.client?.name ?? null,
    inspectionId: event.inspectionId,
    projectId: event.projectId,
  }));
}

type EventData = {
  type: string;
  title: string;
  startsAt: Date;
  endsAt: Date | null;
  allDay: boolean;
  status: string;
  clientId: string | null;
  projectId: string | null;
  address: string | null;
  notes: string | null;
};

export async function createEvent(input: EventData, userId: string) {
  const event = await db.calendarEvent.create({ data: input });

  await logActivity({
    userId,
    action: "event.created",
    summary: `Compromisso agendado: ${event.title}`,
    entityType: "CalendarEvent",
    entityId: event.id,
  });

  return event;
}

export async function updateEvent(id: string, input: EventData, userId: string) {
  const event = await db.calendarEvent.update({ where: { id }, data: input });

  await logActivity({
    userId,
    action: "event.updated",
    summary: `Compromisso atualizado: ${event.title}`,
    entityType: "CalendarEvent",
    entityId: event.id,
  });

  return event;
}

export async function deleteEvent(id: string) {
  await db.calendarEvent.delete({ where: { id } });
}

/* -------------------------------- Tarefas --------------------------------- */

export type TaskItem = {
  id: string;
  title: string;
  detail: string | null;
  dueAt: Date | null;
  done: boolean;
  priority: string;
  source: string;
  entityType: string | null;
  entityId: string | null;
};

/**
 * Tarefas abertas primeiro, ordenadas por vencimento — sem data vai para o fim.
 * SQLite ordena `NULL` primeiro em ASC, o que colocaria as tarefas sem prazo
 * antes das vencidas; por isso a ordenação final é feita aqui.
 */
export async function listTasks(includeDone = false): Promise<TaskItem[]> {
  const tasks = await db.task.findMany({
    where: includeDone ? undefined : { done: false },
    orderBy: [{ done: "asc" }, { createdAt: "desc" }],
    take: 200,
    select: {
      id: true,
      title: true,
      detail: true,
      dueAt: true,
      done: true,
      priority: true,
      source: true,
      entityType: true,
      entityId: true,
    },
  });

  return tasks.sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    if (a.dueAt && b.dueAt) return a.dueAt.getTime() - b.dueAt.getTime();
    if (a.dueAt) return -1;
    if (b.dueAt) return 1;
    return 0;
  });
}

export async function createTask(
  input: { title: string; detail: string | null; dueAt: Date | null; priority: string },
  userId: string,
) {
  const task = await db.task.create({ data: { ...input, source: "MANUAL" } });

  await logActivity({
    userId,
    action: "task.created",
    summary: `Tarefa criada: ${task.title}`,
    entityType: "Task",
    entityId: task.id,
  });

  return task;
}

export async function toggleTask(id: string, done: boolean) {
  return db.task.update({
    where: { id },
    data: { done, doneAt: done ? new Date() : null },
  });
}

export async function deleteTask(id: string) {
  await db.task.delete({ where: { id } });
}

/** Link de volta para a entidade que originou a tarefa. */
export function taskLink(task: Pick<TaskItem, "entityType" | "entityId">): string | null {
  if (!task.entityType || !task.entityId) return null;
  switch (task.entityType) {
    case "Lead":
      return `/crm/${task.entityId}`;
    case "Proposal":
      return `/propostas/${task.entityId}`;
    case "Inspection":
      return `/vistorias/${task.entityId}`;
    case "Payment":
      return "/financeiro";
    default:
      return null;
  }
}
