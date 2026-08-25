import "server-only";

import { db } from "@/lib/db";
import { logActivity } from "@/lib/services/activity";
import { BusinessError } from "@/lib/actions/result";

export type ClientListItem = {
  id: string;
  name: string;
  kind: string;
  city: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  propertyCount: number;
  inspectionCount: number;
  updatedAt: Date;
};

export async function listClients(search?: string): Promise<ClientListItem[]> {
  const clients = await db.client.findMany({
    where: search
      ? {
          OR: [
            { name: { contains: search } },
            { email: { contains: search } },
            { document: { contains: search } },
          ],
        }
      : undefined,
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      kind: true,
      city: true,
      phone: true,
      whatsapp: true,
      email: true,
      updatedAt: true,
      _count: { select: { properties: true, inspections: true } },
    },
  });

  return clients.map((client) => ({
    id: client.id,
    name: client.name,
    kind: client.kind,
    city: client.city,
    phone: client.phone,
    whatsapp: client.whatsapp,
    email: client.email,
    propertyCount: client._count.properties,
    inspectionCount: client._count.inspections,
    updatedAt: client.updatedAt,
  }));
}

/** Lista mínima para preencher `<select>` de cliente. */
export async function listClientOptions() {
  const clients = await db.client.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
  return clients.map((client) => ({ value: client.id, label: client.name }));
}

export async function getClientDetail(id: string) {
  return db.client.findUnique({
    where: { id },
    include: {
      properties: { orderBy: { createdAt: "desc" } },
      inspections: {
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          code: true,
          title: true,
          status: true,
          scheduledAt: true,
        },
      },
      proposals: {
        orderBy: { createdAt: "desc" },
        take: 10,
        select: { id: true, number: true, title: true, status: true, totalCents: true },
      },
      payments: {
        orderBy: { dueDate: "desc" },
        take: 10,
        select: {
          id: true,
          description: true,
          amountCents: true,
          dueDate: true,
          status: true,
        },
      },
      projects: {
        orderBy: { createdAt: "desc" },
        select: { id: true, name: true, status: true },
      },
    },
  });
}

type ClientData = {
  kind: string;
  name: string;
  document: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  addressLine: string | null;
  district: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  notes: string | null;
};

export async function createClient(input: ClientData, userId: string) {
  const client = await db.client.create({
    data: { ...input, consentAt: new Date() },
  });

  await logActivity({
    userId,
    action: "client.created",
    summary: `Cliente cadastrado: ${client.name}`,
    entityType: "Client",
    entityId: client.id,
  });

  return client;
}

export async function updateClient(id: string, input: ClientData, userId: string) {
  const client = await db.client.update({ where: { id }, data: input });

  await logActivity({
    userId,
    action: "client.updated",
    summary: `Cliente atualizado: ${client.name}`,
    entityType: "Client",
    entityId: client.id,
  });

  return client;
}

/**
 * Exclusão a pedido do titular (LGPD).
 *
 * Recusa apagar cliente com histórico financeiro ou documento emitido: a
 * obrigação legal de guarda desses registros prevalece sobre o pedido de
 * exclusão, e apagar em silêncio seria pior do que explicar.
 */
export async function deleteClient(id: string, userId: string) {
  const client = await db.client.findUnique({
    where: { id },
    include: { _count: { select: { payments: true, contracts: true, inspections: true } } },
  });

  if (!client) throw new BusinessError("Cliente não encontrado.");

  if (client._count.payments > 0 || client._count.contracts > 0) {
    throw new BusinessError(
      "Este cliente tem registros financeiros ou contratuais e não pode ser excluído. " +
        "Para atender a um pedido de exclusão, remova antes os lançamentos vinculados.",
    );
  }

  await db.client.delete({ where: { id } });

  await logActivity({
    userId,
    action: "client.deleted",
    summary: `Cliente excluído: ${client.name}`,
    entityType: "Client",
    entityId: id,
  });
}

/* ------------------------------- Imóveis --------------------------------- */

type PropertyData = {
  clientId: string | null;
  kind: string;
  development: string | null;
  tower: string | null;
  unit: string | null;
  addressLine: string | null;
  district: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  areaSqm: number | null;
  notes: string | null;
};

export async function createProperty(input: PropertyData, userId: string) {
  const property = await db.property.create({ data: input });

  await logActivity({
    userId,
    action: "property.created",
    summary: `Imóvel cadastrado: ${describeProperty(property)}`,
    entityType: "Property",
    entityId: property.id,
  });

  return property;
}

export async function updateProperty(id: string, input: PropertyData, userId: string) {
  const property = await db.property.update({ where: { id }, data: input });

  await logActivity({
    userId,
    action: "property.updated",
    summary: `Imóvel atualizado: ${describeProperty(property)}`,
    entityType: "Property",
    entityId: property.id,
  });

  return property;
}

export async function listPropertyOptions(clientId?: string | null) {
  const properties = await db.property.findMany({
    where: clientId ? { clientId } : undefined,
    orderBy: [{ development: "asc" }, { unit: "asc" }],
    select: {
      id: true,
      development: true,
      tower: true,
      unit: true,
      addressLine: true,
      city: true,
    },
  });

  return properties.map((property) => ({
    value: property.id,
    label: describeProperty(property),
  }));
}

/** Rótulo curto e legível de um imóvel: "Residencial Aurora · Torre B · 1204". */
export function describeProperty(property: {
  development?: string | null;
  tower?: string | null;
  unit?: string | null;
  addressLine?: string | null;
  city?: string | null;
}): string {
  const parts = [
    property.development,
    property.tower ? `Torre ${property.tower}` : null,
    property.unit ? `Unidade ${property.unit}` : null,
  ].filter(Boolean);

  if (parts.length > 0) return parts.join(" · ");

  const fallback = [property.addressLine, property.city].filter(Boolean).join(" — ");
  return fallback || "Imóvel sem identificação";
}
