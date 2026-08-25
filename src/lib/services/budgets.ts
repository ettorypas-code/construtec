import "server-only";

import { db } from "@/lib/db";
import { logActivity } from "@/lib/services/activity";
import { BusinessError } from "@/lib/actions/result";
import { computeBudgetItem, computeBudgetTotals } from "@/lib/pricing/budget";

/**
 * Orçamento.
 *
 * Os totais ficam gravados em cache no registro. Poderiam ser calculados a cada
 * leitura, mas a lista de orçamentos e o dashboard precisam somar dezenas deles
 * — e recalcular item a item em toda listagem é trabalho desperdiçado. A
 * consistência é garantida porque `recalculate` roda em toda escrita de item.
 */

export async function listBudgets() {
  return db.budget.findMany({
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      name: true,
      status: true,
      bdiPercent: true,
      directCostCents: true,
      saleTotalCents: true,
      updatedAt: true,
      client: { select: { id: true, name: true } },
      _count: { select: { items: true } },
    },
  });
}

export async function getBudget(id: string) {
  return db.budget.findUnique({
    where: { id },
    include: {
      client: { select: { id: true, name: true } },
      project: { select: { id: true, name: true } },
      serviceType: { select: { id: true, name: true } },
      items: { orderBy: [{ groupName: "asc" }, { sortOrder: "asc" }] },
      proposal: { select: { id: true, number: true, status: true } },
    },
  });
}

export async function listBudgetOptions() {
  const budgets = await db.budget.findMany({
    where: { proposal: null },
    orderBy: { updatedAt: "desc" },
    select: { id: true, name: true, saleTotalCents: true },
  });
  return budgets.map((budget) => ({ value: budget.id, label: budget.name }));
}

type BudgetData = {
  name: string;
  clientId: string | null;
  projectId: string | null;
  serviceTypeId: string | null;
  projectKind: string | null;
  areaSqm: number | null;
  addressLine: string | null;
  city: string | null;
  reference: string | null;
  deadlineText: string | null;
  bdiPercent: number;
  status: string;
  notes: string | null;
};

export async function createBudget(input: BudgetData, userId: string) {
  const budget = await db.budget.create({ data: input });

  await logActivity({
    userId,
    action: "budget.created",
    summary: `Orçamento criado: ${budget.name}`,
    entityType: "Budget",
    entityId: budget.id,
  });

  return budget;
}

export async function updateBudget(id: string, input: BudgetData, userId: string) {
  await db.budget.update({ where: { id }, data: input });
  // Mudar o BDI do orçamento muda o preço de todo item que não tem BDI próprio.
  const budget = await recalculateBudget(id);

  await logActivity({
    userId,
    action: "budget.updated",
    summary: `Orçamento atualizado: ${budget.name}`,
    entityType: "Budget",
    entityId: id,
  });

  return budget;
}

export async function deleteBudget(id: string) {
  const budget = await db.budget.findUnique({
    where: { id },
    include: { proposal: { select: { id: true } } },
  });
  if (!budget) throw new BusinessError("Orçamento não encontrado.");
  if (budget.proposal) {
    throw new BusinessError(
      "Este orçamento está vinculado a uma proposta. Desvincule a proposta antes de excluir.",
    );
  }
  await db.budget.delete({ where: { id } });
}

/* --------------------------------- Itens ---------------------------------- */

type BudgetItemData = {
  groupName: string | null;
  code: string | null;
  description: string;
  unit: string;
  quantity: number;
  materialUnitCents: number | null;
  laborUnitCents: number | null;
  equipmentUnitCents: number | null;
  wastePercent: number;
  bdiPercent: number | null;
};

export async function addBudgetItem(budgetId: string, input: BudgetItemData) {
  const budget = await db.budget.findUnique({ where: { id: budgetId } });
  if (!budget) throw new BusinessError("Orçamento não encontrado.");

  const last = await db.budgetItem.findFirst({
    where: { budgetId },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });

  const normalized = normalizeItem(input);
  const computed = computeBudgetItem(normalized, budget.bdiPercent);

  await db.budgetItem.create({
    data: {
      budgetId,
      groupName: input.groupName,
      code: input.code,
      description: input.description,
      unit: input.unit,
      quantity: normalized.quantity,
      materialUnitCents: normalized.materialUnitCents,
      laborUnitCents: normalized.laborUnitCents,
      equipmentUnitCents: normalized.equipmentUnitCents,
      wastePercent: normalized.wastePercent,
      bdiPercent: normalized.bdiPercent,
      unitCostCents: computed.unitCostCents,
      totalCostCents: computed.totalCostCents,
      unitSaleCents: computed.unitSaleCents,
      totalSaleCents: computed.totalSaleCents,
      sortOrder: (last?.sortOrder ?? -1) + 1,
    },
  });

  return recalculateBudget(budgetId);
}

export async function updateBudgetItem(id: string, input: BudgetItemData) {
  const existing = await db.budgetItem.findUnique({
    where: { id },
    include: { budget: true },
  });
  if (!existing) throw new BusinessError("Item não encontrado.");

  const normalized = normalizeItem(input);
  const computed = computeBudgetItem(normalized, existing.budget.bdiPercent);

  await db.budgetItem.update({
    where: { id },
    data: {
      groupName: input.groupName,
      code: input.code,
      description: input.description,
      unit: input.unit,
      quantity: normalized.quantity,
      materialUnitCents: normalized.materialUnitCents,
      laborUnitCents: normalized.laborUnitCents,
      equipmentUnitCents: normalized.equipmentUnitCents,
      wastePercent: normalized.wastePercent,
      bdiPercent: normalized.bdiPercent,
      unitCostCents: computed.unitCostCents,
      totalCostCents: computed.totalCostCents,
      unitSaleCents: computed.unitSaleCents,
      totalSaleCents: computed.totalSaleCents,
    },
  });

  return recalculateBudget(existing.budgetId);
}

export async function deleteBudgetItem(id: string) {
  const item = await db.budgetItem.delete({ where: { id } });
  return recalculateBudget(item.budgetId);
}

/** Recalcula e grava os totais. Chamado em toda escrita que afeta preço. */
export async function recalculateBudget(budgetId: string) {
  const budget = await db.budget.findUnique({
    where: { id: budgetId },
    include: { items: true },
  });
  if (!budget) throw new BusinessError("Orçamento não encontrado.");

  const totals = computeBudgetTotals(
    budget.items.map((item) => ({
      quantity: item.quantity,
      materialUnitCents: item.materialUnitCents,
      laborUnitCents: item.laborUnitCents,
      equipmentUnitCents: item.equipmentUnitCents,
      wastePercent: item.wastePercent,
      bdiPercent: item.bdiPercent,
    })),
    budget.bdiPercent,
  );

  return db.budget.update({
    where: { id: budgetId },
    data: {
      directCostCents: totals.directCostCents,
      materialCents: totals.materialCents,
      laborCents: totals.laborCents,
      equipmentCents: totals.equipmentCents,
      wasteCents: totals.wasteCents,
      bdiCents: totals.bdiCents,
      saleTotalCents: totals.saleTotalCents,
    },
  });
}

function normalizeItem(input: BudgetItemData) {
  return {
    quantity: input.quantity,
    materialUnitCents: input.materialUnitCents ?? 0,
    laborUnitCents: input.laborUnitCents ?? 0,
    equipmentUnitCents: input.equipmentUnitCents ?? 0,
    wastePercent: input.wastePercent,
    bdiPercent: input.bdiPercent,
  };
}
