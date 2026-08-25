"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { formAction, objectAction } from "@/lib/actions/action";
import { requiredId } from "@/lib/validation/common";
import {
  proposalItemSchema,
  proposalItemUpdateSchema,
  proposalSchema,
  proposalUpdateSchema,
} from "@/lib/validation/commercial";
import {
  addProposalItem,
  createProposal,
  deleteProposalItem,
  sendProposal,
  updateProposal,
  updateProposalItem,
} from "@/lib/services/proposals";

export const createProposalAction = formAction({
  schema: proposalSchema,
  handler: async (input, { user }) => {
    const proposal = await createProposal(input, user.id);
    revalidatePath("/propostas");
    redirect(`/propostas/${proposal.id}`);
  },
});

export const updateProposalAction = formAction({
  schema: proposalUpdateSchema,
  successMessage: "Proposta atualizada.",
  handler: async ({ id, ...input }, { user }) => {
    await updateProposal(id, input, user.id);
    revalidatePath("/propostas");
    revalidatePath(`/propostas/${id}`);
    return { id };
  },
});

export const addProposalItemAction = formAction({
  schema: proposalItemSchema,
  successMessage: "Item adicionado.",
  handler: async (input) => {
    await addProposalItem(input);
    revalidatePath(`/propostas/${input.proposalId}`);
    return { proposalId: input.proposalId };
  },
});

export const updateProposalItemAction = formAction({
  schema: proposalItemUpdateSchema,
  successMessage: "Item atualizado.",
  handler: async ({ id, ...input }) => {
    const proposal = await updateProposalItem(id, input);
    revalidatePath(`/propostas/${proposal.id}`);
    return { id };
  },
});

export const deleteProposalItemAction = objectAction({
  schema: z.object({ id: requiredId, proposalId: requiredId }),
  handler: async ({ id, proposalId }) => {
    await deleteProposalItem(id);
    revalidatePath(`/propostas/${proposalId}`);
    return { id };
  },
});

export const sendProposalAction = objectAction({
  schema: z.object({ id: requiredId }),
  handler: async ({ id }, { user }) => {
    const proposal = await sendProposal(id, user.id);
    revalidatePath("/propostas");
    revalidatePath(`/propostas/${id}`);
    revalidatePath("/dashboard");
    return { id, publicToken: proposal.publicToken };
  },
});
