import { multiplyCents, percentOf } from "@/lib/utils/money";

/**
 * Cálculo de orçamento.
 *
 * A ordem das operações é a que se usa em obra, e ela importa:
 *
 *   1. custo unitário direto = material + mão de obra + equipamento
 *   2. perdas incidem sobre o custo direto      → custo unitário com perdas
 *   3. quantidade multiplica                    → custo total do item
 *   4. BDI incide sobre o custo com perdas      → preço de venda
 *
 * Aplicar BDI antes das perdas inflaria a margem sem que ninguém percebesse,
 * porque o total final continuaria "parecendo certo". Tudo em centavos, com um
 * único arredondamento por etapa. Ver ARQUITETURA.md, decisão D4.
 */

export type BudgetItemInput = {
  quantity: number;
  materialUnitCents: number;
  laborUnitCents: number;
  equipmentUnitCents: number;
  wastePercent: number;
  /** Quando nulo, herda o BDI do orçamento. */
  bdiPercent: number | null;
};

export type BudgetItemComputed = {
  /** Custo direto unitário, sem perdas. */
  baseUnitCents: number;
  /** Custo unitário já com perdas. É a base do BDI. */
  unitCostCents: number;
  totalCostCents: number;
  unitSaleCents: number;
  totalSaleCents: number;
  /** Parcelas do total, para o resumo do orçamento. */
  materialTotalCents: number;
  laborTotalCents: number;
  equipmentTotalCents: number;
  wasteTotalCents: number;
  bdiTotalCents: number;
  effectiveBdiPercent: number;
};

export function computeBudgetItem(
  item: BudgetItemInput,
  defaultBdiPercent: number,
): BudgetItemComputed {
  const baseUnitCents =
    item.materialUnitCents + item.laborUnitCents + item.equipmentUnitCents;

  const wasteUnitCents = percentOf(baseUnitCents, item.wastePercent);
  const unitCostCents = baseUnitCents + wasteUnitCents;

  const effectiveBdiPercent = item.bdiPercent ?? defaultBdiPercent;
  const bdiUnitCents = percentOf(unitCostCents, effectiveBdiPercent);
  const unitSaleCents = unitCostCents + bdiUnitCents;

  return {
    baseUnitCents,
    unitCostCents,
    totalCostCents: multiplyCents(unitCostCents, item.quantity),
    unitSaleCents,
    totalSaleCents: multiplyCents(unitSaleCents, item.quantity),
    materialTotalCents: multiplyCents(item.materialUnitCents, item.quantity),
    laborTotalCents: multiplyCents(item.laborUnitCents, item.quantity),
    equipmentTotalCents: multiplyCents(item.equipmentUnitCents, item.quantity),
    wasteTotalCents: multiplyCents(wasteUnitCents, item.quantity),
    bdiTotalCents: multiplyCents(bdiUnitCents, item.quantity),
    effectiveBdiPercent,
  };
}

export type BudgetTotals = {
  directCostCents: number;
  materialCents: number;
  laborCents: number;
  equipmentCents: number;
  wasteCents: number;
  bdiCents: number;
  saleTotalCents: number;
  /** Margem sobre o preço de venda, em pontos percentuais. */
  marginPercent: number | null;
};

export function computeBudgetTotals(
  items: BudgetItemInput[],
  defaultBdiPercent: number,
): BudgetTotals {
  const computed = items.map((item) => computeBudgetItem(item, defaultBdiPercent));

  const totals = computed.reduce(
    (accumulator, item) => ({
      directCostCents: accumulator.directCostCents + item.totalCostCents,
      materialCents: accumulator.materialCents + item.materialTotalCents,
      laborCents: accumulator.laborCents + item.laborTotalCents,
      equipmentCents: accumulator.equipmentCents + item.equipmentTotalCents,
      wasteCents: accumulator.wasteCents + item.wasteTotalCents,
      bdiCents: accumulator.bdiCents + item.bdiTotalCents,
      saleTotalCents: accumulator.saleTotalCents + item.totalSaleCents,
    }),
    {
      directCostCents: 0,
      materialCents: 0,
      laborCents: 0,
      equipmentCents: 0,
      wasteCents: 0,
      bdiCents: 0,
      saleTotalCents: 0,
    },
  );

  return {
    ...totals,
    marginPercent:
      totals.saleTotalCents > 0
        ? ((totals.saleTotalCents - totals.directCostCents) / totals.saleTotalCents) * 100
        : null,
  };
}
