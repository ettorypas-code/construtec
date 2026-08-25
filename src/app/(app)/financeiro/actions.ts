"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { formAction, objectAction } from "@/lib/actions/action";
import { requiredId } from "@/lib/validation/common";
import {
  expenseSchema,
  paymentSchema,
  settleExpenseSchema,
  settlePaymentSchema,
} from "@/lib/validation/finance";
import {
  createExpense,
  createPayment,
  deleteExpense,
  deletePayment,
  settleExpense,
  settlePayment,
} from "@/lib/services/finance";

function revalidateFinance() {
  revalidatePath("/financeiro");
  revalidatePath("/dashboard");
}

export const createPaymentAction = formAction({
  schema: paymentSchema,
  successMessage: "Recebimento lançado.",
  handler: async (input, { user }) => {
    const payment = await createPayment(input, user.id);
    revalidateFinance();
    return { id: payment.id };
  },
});

export const settlePaymentAction = objectAction({
  schema: settlePaymentSchema,
  handler: async ({ id, method }, { user }) => {
    await settlePayment(id, method, user.id);
    revalidateFinance();
    return { id };
  },
});

export const deletePaymentAction = objectAction({
  schema: z.object({ id: requiredId }),
  handler: async ({ id }) => {
    await deletePayment(id);
    revalidateFinance();
    return { id };
  },
});

export const createExpenseAction = formAction({
  schema: expenseSchema,
  successMessage: "Despesa lançada.",
  handler: async (input, { user }) => {
    const expense = await createExpense(input, user.id);
    revalidateFinance();
    return { id: expense.id };
  },
});

export const settleExpenseAction = objectAction({
  schema: settleExpenseSchema,
  handler: async ({ id }, { user }) => {
    await settleExpense(id, user.id);
    revalidateFinance();
    return { id };
  },
});

export const deleteExpenseAction = objectAction({
  schema: z.object({ id: requiredId }),
  handler: async ({ id }) => {
    await deleteExpense(id);
    revalidateFinance();
    return { id };
  },
});
