import "server-only";

import { db } from "@/lib/db";
import { logActivity } from "@/lib/services/activity";
import { monthRange } from "@/lib/utils/dates";

export type MonthSummary = {
  receivedCents: number;
  forecastCents: number;
  expensesPaidCents: number;
  expensesForecastCents: number;
  profitCents: number;
  overdueReceivableCents: number;
  overduePayableCents: number;
};

export async function getMonthSummary(reference: Date): Promise<MonthSummary> {
  const { start, end } = monthRange(reference);
  const now = new Date();

  const [received, forecast, expensesPaid, expensesForecast, overdueIn, overdueOut] =
    await Promise.all([
      db.payment.aggregate({
        where: { status: "RECEBIDO", paidAt: { gte: start, lte: end } },
        _sum: { amountCents: true },
      }),
      db.payment.aggregate({
        where: { status: "PREVISTO", dueDate: { gte: start, lte: end } },
        _sum: { amountCents: true },
      }),
      db.expense.aggregate({
        where: { status: "PAGA", paidAt: { gte: start, lte: end } },
        _sum: { amountCents: true },
      }),
      db.expense.aggregate({
        where: { status: "PREVISTA", dueDate: { gte: start, lte: end } },
        _sum: { amountCents: true },
      }),
      db.payment.aggregate({
        where: { status: "PREVISTO", dueDate: { lt: now } },
        _sum: { amountCents: true },
      }),
      db.expense.aggregate({
        where: { status: "PREVISTA", dueDate: { lt: now } },
        _sum: { amountCents: true },
      }),
    ]);

  const receivedCents = received._sum.amountCents ?? 0;
  const forecastCents = forecast._sum.amountCents ?? 0;
  const expensesPaidCents = expensesPaid._sum.amountCents ?? 0;
  const expensesForecastCents = expensesForecast._sum.amountCents ?? 0;

  return {
    receivedCents,
    forecastCents,
    expensesPaidCents,
    expensesForecastCents,
    // Lucro estimado considera o previsto dos dois lados: é a pergunta real do
    // mês corrente ("como fecha se tudo acontecer"), não o caixa realizado.
    profitCents: receivedCents + forecastCents - expensesPaidCents - expensesForecastCents,
    overdueReceivableCents: overdueIn._sum.amountCents ?? 0,
    overduePayableCents: overdueOut._sum.amountCents ?? 0,
  };
}

export async function listPayments(reference: Date) {
  const { start, end } = monthRange(reference);
  return db.payment.findMany({
    where: {
      OR: [
        { dueDate: { gte: start, lte: end } },
        { paidAt: { gte: start, lte: end } },
        { status: "PREVISTO", dueDate: { lt: start } },
      ],
    },
    orderBy: [{ status: "asc" }, { dueDate: "asc" }],
    include: {
      client: { select: { id: true, name: true } },
      proposal: { select: { id: true, number: true } },
    },
  });
}

export async function listExpenses(reference: Date) {
  const { start, end } = monthRange(reference);
  return db.expense.findMany({
    where: {
      OR: [
        { dueDate: { gte: start, lte: end } },
        { paidAt: { gte: start, lte: end } },
        { status: "PREVISTA", dueDate: { lt: start } },
      ],
    },
    orderBy: [{ status: "asc" }, { dueDate: "asc" }],
  });
}

export async function createPayment(
  input: {
    description: string;
    clientId: string | null;
    projectId: string | null;
    amountCents: number;
    dueDate: Date;
    notes: string | null;
  },
  userId: string,
) {
  const payment = await db.payment.create({ data: { ...input, status: "PREVISTO" } });

  await logActivity({
    userId,
    action: "payment.created",
    summary: `Recebimento previsto: ${payment.description}`,
    entityType: "Payment",
    entityId: payment.id,
  });

  return payment;
}

export async function settlePayment(id: string, method: string, userId: string) {
  const payment = await db.payment.update({
    where: { id },
    data: { status: "RECEBIDO", paidAt: new Date(), method },
  });

  await logActivity({
    userId,
    action: "payment.received",
    summary: `Recebimento confirmado: ${payment.description}`,
    entityType: "Payment",
    entityId: payment.id,
  });

  return payment;
}

export async function deletePayment(id: string) {
  await db.payment.delete({ where: { id } });
}

export async function createExpense(
  input: {
    description: string;
    category: string;
    supplier: string | null;
    projectId: string | null;
    amountCents: number;
    dueDate: Date;
    notes: string | null;
  },
  userId: string,
) {
  const expense = await db.expense.create({ data: { ...input, status: "PREVISTA" } });

  await logActivity({
    userId,
    action: "expense.created",
    summary: `Despesa lançada: ${expense.description}`,
    entityType: "Expense",
    entityId: expense.id,
  });

  return expense;
}

export async function settleExpense(id: string, userId: string) {
  const expense = await db.expense.update({
    where: { id },
    data: { status: "PAGA", paidAt: new Date() },
  });

  await logActivity({
    userId,
    action: "expense.paid",
    summary: `Despesa paga: ${expense.description}`,
    entityType: "Expense",
    entityId: expense.id,
  });

  return expense;
}

export async function deleteExpense(id: string) {
  await db.expense.delete({ where: { id } });
}
