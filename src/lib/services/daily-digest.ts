import "server-only";

import { addDays, startOfDay } from "date-fns";
import { db } from "@/lib/db";
import { dayRange, formatDate, formatDayLabel, formatTime } from "@/lib/utils/dates";
import { formatBRL } from "@/lib/utils/money";
import { LeadStatus } from "@/domain/enums";
import { eventTypeLabels } from "@/domain/labels";
import type { EventType } from "@/domain/enums";

/**
 * Resumo do dia.
 *
 * Responde a única pergunta que importa às 7 da manhã: o que eu faço hoje.
 * Devolve dados estruturados (para a tela) e um texto pronto (para colar no
 * WhatsApp ou mandar por um agendador).
 *
 * Não envia nada sozinho. Envio real depende de provedor de e-mail ou da API
 * do WhatsApp — Fase 4. O que existe hoje é: abrir o app e ver, ou copiar e
 * colar. Ver `/api/resumo-diario` para disparo por agendador.
 */

export type DigestEvent = {
  time: string;
  title: string;
  type: string;
  clientName: string | null;
  address: string | null;
};

export type DigestTask = { title: string; due: string; overdue: boolean };
export type DigestContact = { name: string; phone: string | null; due: string; overdue: boolean };

export type DailyDigest = {
  date: Date;
  dateLabel: string;
  events: DigestEvent[];
  tasks: DigestTask[];
  contacts: DigestContact[];
  finance: {
    overdueReceivableCents: number;
    dueNextWeekCents: number;
  };
  /** `true` quando não há absolutamente nada — a tela mostra outra mensagem. */
  empty: boolean;
};

export async function buildDailyDigest(reference = new Date()): Promise<DailyDigest> {
  const { start, end } = dayRange(reference);
  const weekAhead = addDays(end, 7);
  const today = startOfDay(reference);

  const [events, tasks, leads, overdueReceivable, dueNextWeek] = await Promise.all([
    db.calendarEvent.findMany({
      where: { startsAt: { gte: start, lte: end }, status: { not: "CANCELADO" } },
      orderBy: { startsAt: "asc" },
      select: {
        title: true,
        type: true,
        startsAt: true,
        allDay: true,
        address: true,
        client: { select: { name: true } },
      },
    }),
    // Vencidas e as de hoje: o que passou continua sendo trabalho de hoje.
    db.task.findMany({
      where: { done: false, OR: [{ dueAt: { lte: end } }, { dueAt: null }] },
      orderBy: [{ dueAt: "asc" }],
      take: 20,
      select: { title: true, dueAt: true },
    }),
    db.lead.findMany({
      where: {
        nextContactAt: { lte: end },
        status: { notIn: [LeadStatus.PERDIDO, LeadStatus.CONCLUIDO] },
      },
      orderBy: { nextContactAt: "asc" },
      take: 15,
      select: { name: true, phone: true, whatsapp: true, nextContactAt: true },
    }),
    db.payment.aggregate({
      where: { status: "PREVISTO", dueDate: { lt: start } },
      _sum: { amountCents: true },
    }),
    db.payment.aggregate({
      where: { status: "PREVISTO", dueDate: { gte: start, lte: weekAhead } },
      _sum: { amountCents: true },
    }),
  ]);

  const digestEvents: DigestEvent[] = events.map((event) => ({
    time: event.allDay ? "dia todo" : formatTime(event.startsAt),
    title: event.title,
    type: eventTypeLabels[event.type as EventType] ?? event.type,
    clientName: event.client?.name ?? null,
    address: event.address,
  }));

  const digestTasks: DigestTask[] = tasks.map((task) => ({
    title: task.title,
    due: task.dueAt ? formatDate(task.dueAt) : "sem prazo",
    overdue: Boolean(task.dueAt && task.dueAt < today),
  }));

  const digestContacts: DigestContact[] = leads.map((lead) => ({
    name: lead.name,
    phone: lead.whatsapp ?? lead.phone,
    due: lead.nextContactAt ? formatDate(lead.nextContactAt) : "sem data",
    overdue: Boolean(lead.nextContactAt && lead.nextContactAt < today),
  }));

  const finance = {
    overdueReceivableCents: overdueReceivable._sum.amountCents ?? 0,
    dueNextWeekCents: dueNextWeek._sum.amountCents ?? 0,
  };

  return {
    date: reference,
    dateLabel: formatDayLabel(reference),
    events: digestEvents,
    tasks: digestTasks,
    contacts: digestContacts,
    finance,
    empty:
      digestEvents.length === 0 &&
      digestTasks.length === 0 &&
      digestContacts.length === 0 &&
      finance.overdueReceivableCents === 0,
  };
}

/**
 * Versão em texto puro, para colar no WhatsApp.
 *
 * Sem markdown e sem emoji: o destino é o seu próprio WhatsApp, e o que importa
 * é conseguir ler a lista com o telefone na mão dentro do carro.
 */
export function formatDigestText(digest: DailyDigest, companyName: string): string {
  const lines: string[] = [`${companyName} — ${digest.dateLabel}`, ""];

  if (digest.empty) {
    lines.push("Nada agendado, nenhuma tarefa aberta e nenhum contato pendente.");
    return lines.join("\n");
  }

  if (digest.events.length > 0) {
    lines.push(`COMPROMISSOS (${digest.events.length})`);
    for (const event of digest.events) {
      const detail = [event.clientName, event.address].filter(Boolean).join(" · ");
      lines.push(`${event.time}  ${event.title}${detail ? ` — ${detail}` : ""}`);
    }
    lines.push("");
  }

  if (digest.contacts.length > 0) {
    lines.push(`CONTATOS A FAZER (${digest.contacts.length})`);
    for (const contact of digest.contacts) {
      lines.push(`- ${contact.name}${contact.overdue ? " (atrasado)" : ""}`);
    }
    lines.push("");
  }

  if (digest.tasks.length > 0) {
    const overdue = digest.tasks.filter((task) => task.overdue).length;
    lines.push(
      `TAREFAS (${digest.tasks.length}${overdue > 0 ? `, ${overdue} em atraso` : ""})`,
    );
    for (const task of digest.tasks) {
      lines.push(`- ${task.title}${task.overdue ? " (venceu)" : ""}`);
    }
    lines.push("");
  }

  const { overdueReceivableCents, dueNextWeekCents } = digest.finance;
  if (overdueReceivableCents > 0 || dueNextWeekCents > 0) {
    lines.push("FINANCEIRO");
    if (overdueReceivableCents > 0) {
      lines.push(`- ${formatBRL(overdueReceivableCents)} a receber em atraso`);
    }
    if (dueNextWeekCents > 0) {
      lines.push(`- ${formatBRL(dueNextWeekCents)} previsto para os próximos 7 dias`);
    }
  }

  return lines.join("\n").trim();
}

/**
 * Grava o resumo como notificação no app.
 *
 * Chamado pelo agendador. A marca em ActivityLog impede resumo duplicado se o
 * agendador disparar duas vezes no mesmo dia.
 */
export async function recordDigestNotification(text: string, reference = new Date()) {
  const { start, end } = dayRange(reference);

  const already = await db.activityLog.findFirst({
    where: { action: "digest.sent", createdAt: { gte: start, lte: end } },
  });
  if (already) return { created: false };

  const admins = await db.user.findMany({
    where: { role: "ADMIN", active: true },
    select: { id: true },
  });

  await db.notification.createMany({
    data: admins.map((admin) => ({
      userId: admin.id,
      kind: "RESUMO_DIARIO",
      title: `Resumo de ${formatDate(reference)}`,
      body: text,
      link: "/dashboard",
    })),
  });

  await db.activityLog.create({
    data: { action: "digest.sent", summary: `Resumo diário gerado (${formatDate(reference)})` },
  });

  return { created: true };
}
