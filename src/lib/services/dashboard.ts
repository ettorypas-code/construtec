import "server-only";

import { db } from "@/lib/db";
import { dayRange, monthRange } from "@/lib/utils/dates";
import { LeadStatus, PIPELINE_STAGES, WON_STAGES } from "@/domain/enums";

/**
 * Números do dashboard.
 *
 * Uma consulta por indicador, todas em paralelo. Poderia virar SQL bruto se um
 * dia pesar, mas com o volume de uma operação individual isso é otimização
 * prematura — e o custo de manter SQL à mão é alto.
 */

export type TodayPanel = {
  events: Array<{
    id: string;
    title: string;
    type: string;
    startsAt: Date;
    address: string | null;
    clientName: string | null;
  }>;
  openTasks: number;
  overdueTasks: number;
  followUpsDue: number;
  proposalsAwaiting: number;
  paymentsOverdue: number;
};

export type BusinessPanel = {
  newLeadsThisMonth: number;
  activePipeline: number;
  pipelineValueCents: number;
  proposalsSent: number;
  proposalsAccepted: number;
  conversionRate: number | null;
  averageTicketCents: number | null;
};

export type WorksPanel = {
  activeProjects: number;
  lateProjects: number;
  openFindings: number;
  inspectionsScheduled: number;
  inspectionsInProgress: number;
};

export type FinancePanel = {
  receivedThisMonthCents: number;
  forecastThisMonthCents: number;
  expensesThisMonthCents: number;
  profitEstimateCents: number;
  receivableCents: number;
  overdueReceivableCents: number;
};

export async function getTodayPanel(): Promise<TodayPanel> {
  const now = new Date();
  const { start, end } = dayRange(now);

  const [events, openTasks, overdueTasks, followUpsDue, proposalsAwaiting, paymentsOverdue] =
    await Promise.all([
      db.calendarEvent.findMany({
        where: { startsAt: { gte: start, lte: end }, status: { not: "CANCELADO" } },
        orderBy: { startsAt: "asc" },
        take: 8,
        select: {
          id: true,
          title: true,
          type: true,
          startsAt: true,
          address: true,
          client: { select: { name: true } },
        },
      }),
      db.task.count({ where: { done: false } }),
      db.task.count({ where: { done: false, dueAt: { lt: start } } }),
      db.lead.count({
        where: {
          nextContactAt: { lte: end },
          status: { notIn: [LeadStatus.PERDIDO, LeadStatus.CONCLUIDO] },
        },
      }),
      db.proposal.count({ where: { status: { in: ["ENVIADA", "VISUALIZADA"] } } }),
      db.payment.count({ where: { status: "PREVISTO", dueDate: { lt: start } } }),
    ]);

  return {
    events: events.map((event) => ({
      id: event.id,
      title: event.title,
      type: event.type,
      startsAt: event.startsAt,
      address: event.address,
      clientName: event.client?.name ?? null,
    })),
    openTasks,
    overdueTasks,
    followUpsDue,
    proposalsAwaiting,
    paymentsOverdue,
  };
}

export async function getBusinessPanel(reference = new Date()): Promise<BusinessPanel> {
  const { start, end } = monthRange(reference);

  const [newLeadsThisMonth, pipeline, proposalsSent, proposalsAccepted, acceptedTotals, wonLeads] =
    await Promise.all([
      db.lead.count({ where: { createdAt: { gte: start, lte: end } } }),
      db.lead.findMany({
        where: { status: { in: [...PIPELINE_STAGES] } },
        select: { potentialValueCents: true },
      }),
      db.proposal.count({ where: { sentAt: { gte: start, lte: end } } }),
      db.proposal.count({ where: { status: "ACEITA", decidedAt: { gte: start, lte: end } } }),
      db.proposal.aggregate({
        where: { status: "ACEITA" },
        _avg: { totalCents: true },
      }),
      db.lead.count({ where: { status: { in: [...WON_STAGES] } } }),
    ]);

  const totalLeads = await db.lead.count();
  const conversionRate = totalLeads > 0 ? (wonLeads / totalLeads) * 100 : null;

  return {
    newLeadsThisMonth,
    activePipeline: pipeline.length,
    pipelineValueCents: pipeline.reduce((sum, lead) => sum + (lead.potentialValueCents ?? 0), 0),
    proposalsSent,
    proposalsAccepted,
    conversionRate,
    averageTicketCents: acceptedTotals._avg.totalCents
      ? Math.round(acceptedTotals._avg.totalCents)
      : null,
  };
}

export async function getWorksPanel(): Promise<WorksPanel> {
  const now = new Date();

  const [activeProjects, lateProjects, openFindings, inspectionsScheduled, inspectionsInProgress] =
    await Promise.all([
      db.project.count({ where: { status: { in: ["PLANEJAMENTO", "EM_ANDAMENTO"] } } }),
      db.project.count({
        where: { status: "EM_ANDAMENTO", endDate: { lt: now } },
      }),
      db.finding.count({ where: { status: "PENDENTE" } }),
      db.inspection.count({ where: { status: "AGENDADA" } }),
      db.inspection.count({ where: { status: "EM_ANDAMENTO" } }),
    ]);

  return {
    activeProjects,
    lateProjects,
    openFindings,
    inspectionsScheduled,
    inspectionsInProgress,
  };
}

export async function getFinancePanel(reference = new Date()): Promise<FinancePanel> {
  const { start, end } = monthRange(reference);
  const now = new Date();

  const [received, forecast, expenses, receivable, overdue] = await Promise.all([
    db.payment.aggregate({
      where: { status: "RECEBIDO", paidAt: { gte: start, lte: end } },
      _sum: { amountCents: true },
    }),
    db.payment.aggregate({
      where: { status: "PREVISTO", dueDate: { gte: start, lte: end } },
      _sum: { amountCents: true },
    }),
    db.expense.aggregate({
      where: { status: { not: "CANCELADA" }, dueDate: { gte: start, lte: end } },
      _sum: { amountCents: true },
    }),
    db.payment.aggregate({
      where: { status: "PREVISTO" },
      _sum: { amountCents: true },
    }),
    db.payment.aggregate({
      where: { status: "PREVISTO", dueDate: { lt: now } },
      _sum: { amountCents: true },
    }),
  ]);

  const receivedCents = received._sum.amountCents ?? 0;
  const forecastCents = forecast._sum.amountCents ?? 0;
  const expensesCents = expenses._sum.amountCents ?? 0;

  return {
    receivedThisMonthCents: receivedCents,
    forecastThisMonthCents: forecastCents,
    expensesThisMonthCents: expensesCents,
    profitEstimateCents: receivedCents + forecastCents - expensesCents,
    receivableCents: receivable._sum.amountCents ?? 0,
    overdueReceivableCents: overdue._sum.amountCents ?? 0,
  };
}
