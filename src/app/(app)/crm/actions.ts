"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { formAction, objectAction } from "@/lib/actions/action";
import {
  leadActivitySchema,
  leadConvertSchema,
  leadSchema,
  leadStatusSchema,
  leadUpdateSchema,
} from "@/lib/validation/crm";
import {
  addLeadActivity,
  changeLeadStatus,
  convertLeadToClient,
  createLead,
  deleteLead,
  updateLead,
} from "@/lib/services/leads";
import { z } from "zod";
import { requiredId } from "@/lib/validation/common";

export const createLeadAction = formAction({
  schema: leadSchema,
  handler: async (input, { user }) => {
    const lead = await createLead(input, user.id);
    revalidatePath("/crm");
    revalidatePath("/dashboard");
    redirect(`/crm/${lead.id}`);
  },
});

export const updateLeadAction = formAction({
  schema: leadUpdateSchema,
  successMessage: "Lead atualizado.",
  handler: async ({ id, ...input }, { user }) => {
    await updateLead(id, input, user.id);
    revalidatePath("/crm");
    revalidatePath(`/crm/${id}`);
    return { id };
  },
});

export const changeLeadStatusAction = objectAction({
  schema: leadStatusSchema,
  handler: async ({ id, status, lostReason }, { user }) => {
    await changeLeadStatus(id, status, lostReason, user.id);
    revalidatePath("/crm");
    revalidatePath(`/crm/${id}`);
    revalidatePath("/dashboard");
    return { id, status };
  },
});

export const addLeadActivityAction = formAction({
  schema: leadActivitySchema,
  successMessage: "Contato registrado.",
  handler: async (input, { user }) => {
    await addLeadActivity(input, user.id);
    revalidatePath("/crm");
    revalidatePath(`/crm/${input.leadId}`);
    revalidatePath("/dashboard");
    return { leadId: input.leadId };
  },
});

export const convertLeadAction = formAction({
  schema: leadConvertSchema,
  handler: async (input, { user }) => {
    const client = await convertLeadToClient(input, user.id);
    revalidatePath("/crm");
    revalidatePath("/clientes");
    redirect(`/clientes/${client.id}`);
  },
});

export const deleteLeadAction = objectAction({
  schema: z.object({ id: requiredId }),
  handler: async ({ id }, { user }) => {
    await deleteLead(id, user.id);
    revalidatePath("/crm");
    return { id };
  },
});
