"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { formAction, objectAction } from "@/lib/actions/action";
import { requiredId } from "@/lib/validation/common";
import {
  budgetItemSchema,
  budgetItemUpdateSchema,
  budgetSchema,
  budgetUpdateSchema,
} from "@/lib/validation/commercial";
import {
  addBudgetItem,
  createBudget,
  deleteBudget,
  deleteBudgetItem,
  updateBudget,
  updateBudgetItem,
} from "@/lib/services/budgets";

export const createBudgetAction = formAction({
  schema: budgetSchema,
  handler: async (input, { user }) => {
    const budget = await createBudget(input, user.id);
    revalidatePath("/orcamentos");
    redirect(`/orcamentos/${budget.id}`);
  },
});

export const updateBudgetAction = formAction({
  schema: budgetUpdateSchema,
  successMessage: "Orçamento atualizado.",
  handler: async ({ id, ...input }, { user }) => {
    await updateBudget(id, input, user.id);
    revalidatePath("/orcamentos");
    revalidatePath(`/orcamentos/${id}`);
    return { id };
  },
});

export const addBudgetItemAction = formAction({
  schema: budgetItemSchema,
  successMessage: "Item adicionado.",
  handler: async ({ budgetId, ...input }) => {
    await addBudgetItem(budgetId, input);
    revalidatePath(`/orcamentos/${budgetId}`);
    return { budgetId };
  },
});

export const updateBudgetItemAction = formAction({
  schema: budgetItemUpdateSchema,
  successMessage: "Item atualizado.",
  handler: async ({ id, budgetId, ...input }) => {
    await updateBudgetItem(id, input);
    revalidatePath(`/orcamentos/${budgetId}`);
    return { id };
  },
});

export const deleteBudgetItemAction = objectAction({
  schema: z.object({ id: requiredId, budgetId: requiredId }),
  handler: async ({ id, budgetId }) => {
    await deleteBudgetItem(id);
    revalidatePath(`/orcamentos/${budgetId}`);
    return { id };
  },
});

export const deleteBudgetAction = objectAction({
  schema: z.object({ id: requiredId }),
  handler: async ({ id }) => {
    await deleteBudget(id);
    revalidatePath("/orcamentos");
    return { id };
  },
});
