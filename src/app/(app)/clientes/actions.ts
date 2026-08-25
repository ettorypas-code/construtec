"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { formAction, objectAction } from "@/lib/actions/action";
import { requiredId } from "@/lib/validation/common";
import {
  clientSchema,
  clientUpdateSchema,
  propertySchema,
  propertyUpdateSchema,
} from "@/lib/validation/crm";
import {
  createClient,
  createProperty,
  deleteClient,
  updateClient,
  updateProperty,
} from "@/lib/services/clients";

export const createClientAction = formAction({
  schema: clientSchema,
  handler: async (input, { user }) => {
    const client = await createClient(input, user.id);
    revalidatePath("/clientes");
    redirect(`/clientes/${client.id}`);
  },
});

export const updateClientAction = formAction({
  schema: clientUpdateSchema,
  successMessage: "Cliente atualizado.",
  handler: async ({ id, ...input }, { user }) => {
    await updateClient(id, input, user.id);
    revalidatePath("/clientes");
    revalidatePath(`/clientes/${id}`);
    return { id };
  },
});

export const deleteClientAction = objectAction({
  schema: z.object({ id: requiredId }),
  handler: async ({ id }, { user }) => {
    await deleteClient(id, user.id);
    revalidatePath("/clientes");
    return { id };
  },
});

export const createPropertyAction = formAction({
  schema: propertySchema,
  successMessage: "Imóvel cadastrado.",
  handler: async (input, { user }) => {
    const property = await createProperty(input, user.id);
    revalidatePath("/clientes");
    if (input.clientId) revalidatePath(`/clientes/${input.clientId}`);
    return { id: property.id };
  },
});

export const updatePropertyAction = formAction({
  schema: propertyUpdateSchema,
  successMessage: "Imóvel atualizado.",
  handler: async ({ id, ...input }, { user }) => {
    await updateProperty(id, input, user.id);
    revalidatePath("/clientes");
    if (input.clientId) revalidatePath(`/clientes/${input.clientId}`);
    return { id };
  },
});
