import "server-only";

import { db } from "@/lib/db";
import type { Option } from "@/domain/labels";

export type ServiceTypeSummary = {
  id: string;
  code: string;
  name: string;
  category: string;
  shortPitch: string | null;
  description: string | null;
  basePriceCents: number | null;
  priceNote: string | null;
  restrictionLevel: string;
  requiresTechnicalResponsible: boolean;
  requiresArtRrt: boolean;
  legalNotes: string | null;
  defaultDocumentKind: string | null;
  active: boolean;
  isAddon: boolean;
  priceTiers: Array<{
    id: string;
    label: string;
    maxAreaSqm: number | null;
    priceCents: number;
    note: string | null;
  }>;
};

export async function listServiceTypes(onlyActive = true): Promise<ServiceTypeSummary[]> {
  return db.serviceType.findMany({
    where: onlyActive ? { active: true } : undefined,
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      code: true,
      name: true,
      category: true,
      shortPitch: true,
      description: true,
      basePriceCents: true,
      priceNote: true,
      restrictionLevel: true,
      requiresTechnicalResponsible: true,
      requiresArtRrt: true,
      legalNotes: true,
      defaultDocumentKind: true,
      active: true,
      isAddon: true,
      priceTiers: {
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          label: true,
          maxAreaSqm: true,
          priceCents: true,
          note: true,
        },
      },
    },
  });
}

/**
 * Preço sugerido para uma metragem.
 *
 * Percorre as faixas na ordem e devolve a primeira que comporta a área. A
 * última faixa costuma ter `maxAreaSqm` nulo — é o "acima disso", e quando o
 * preço dela é zero significa "sob orçamento".
 */
export function priceForArea(
  tiers: ServiceTypeSummary["priceTiers"],
  areaSqm: number | null | undefined,
): { label: string; priceCents: number; underQuote: boolean } | null {
  if (tiers.length === 0 || areaSqm == null) return null;

  const tier =
    tiers.find((t) => t.maxAreaSqm !== null && areaSqm <= t.maxAreaSqm) ??
    tiers.find((t) => t.maxAreaSqm === null);

  if (!tier) return null;
  return { label: tier.label, priceCents: tier.priceCents, underQuote: tier.priceCents === 0 };
}

/** Serviços principais para `<select>`. Adicionais ficam de fora. */
export async function listServiceTypeOptions(): Promise<Option<string>[]> {
  const services = await listServiceTypes(true);
  return services
    .filter((service) => !service.isAddon)
    .map((service) => ({ value: service.id, label: service.name }));
}

/** Adicionais avulsos, para somar como item de proposta. */
export async function listAddonOptions(): Promise<Option<string>[]> {
  const services = await listServiceTypes(true);
  return services
    .filter((service) => service.isAddon)
    .map((service) => ({ value: service.id, label: service.name }));
}

export async function getServiceType(id: string) {
  return db.serviceType.findUnique({ where: { id } });
}

export async function listChecklistTemplateOptions(): Promise<Option<string>[]> {
  const templates = await db.checklistTemplate.findMany({
    where: { active: true },
    orderBy: [{ isDefault: "desc" }, { name: "asc" }],
    select: { id: true, name: true },
  });
  return templates.map((template) => ({ value: template.id, label: template.name }));
}

export async function getCompanySettings() {
  const settings = await db.companySettings.findUnique({ where: { id: "default" } });
  if (settings) return settings;

  // O seed cria este registro; se alguém apagou, recriamos com o mínimo em vez
  // de deixar toda a aplicação quebrar por falta de configuração.
  return db.companySettings.create({
    data: { id: "default", name: "Minha empresa" },
  });
}
