import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { getCompanySettings, listServiceTypes } from "@/lib/services/catalog";
import { checkServiceAvailability } from "@/lib/compliance";
import { PageHeader, SectionHeading } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatBRL } from "@/lib/utils/money";
import {
  findingCategoryLabels,
  restrictionLevelLabels,
  restrictionLevelTones,
  serviceCategoryLabels,
  severityLabels,
  severityTones,
} from "@/domain/labels";
import type {
  FindingCategory,
  RestrictionLevel,
  ServiceCategory,
  Severity,
} from "@/domain/enums";

export const metadata: Metadata = { title: "Biblioteca" };

/**
 * Biblioteca de conhecimento operacional.
 *
 * É aqui que a experiência de obra vira processo: catálogo de serviços com as
 * regras legais, modelos de checklist e problemas recorrentes. A edição desses
 * conteúdos ainda é feita pelo seed (`prisma/seed-data/`) — esta tela é a visão
 * consolidada do que o sistema sabe.
 */
export default async function LibraryPage() {
  await requireUser();

  const [services, templates, findings, company] = await Promise.all([
    listServiceTypes(false),
    db.checklistTemplate.findMany({
      orderBy: [{ isDefault: "desc" }, { name: "asc" }],
      include: {
        rooms: {
          orderBy: { sortOrder: "asc" },
          include: { _count: { select: { items: true } } },
        },
      },
    }),
    db.findingLibrary.findMany({
      where: { active: true },
      orderBy: [{ category: "asc" }, { usageCount: "desc" }, { title: "asc" }],
    }),
    getCompanySettings(),
  ]);

  const findingsByCategory = new Map<string, typeof findings>();
  for (const finding of findings) {
    const list = findingsByCategory.get(finding.category) ?? [];
    list.push(finding);
    findingsByCategory.set(finding.category, list);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Biblioteca"
        description="Serviços, checklists e problemas recorrentes — o conhecimento que o sistema aplica sozinho."
      />

      <section className="space-y-3">
        <SectionHeading title="Catálogo de serviços" />
        <div className="grid gap-3 lg:grid-cols-2">
          {services.map((service) => {
            const availability = checkServiceAvailability(service, company);
            const restriction = service.restrictionLevel as RestrictionLevel;

            return (
              <Card key={service.id} className={service.active ? undefined : "opacity-70"}>
                <CardBody className="space-y-2.5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-ink-900">{service.name}</p>
                      <p className="mt-0.5 text-xs text-ink-500">
                        {serviceCategoryLabels[service.category as ServiceCategory]} ·{" "}
                        <span className="font-mono">{service.code}</span>
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-1.5">
                      <Badge tone={restrictionLevelTones[restriction]}>
                        {restrictionLevelLabels[restriction]}
                      </Badge>
                      {service.requiresArtRrt ? <Badge tone="warning">ART/RRT</Badge> : null}
                      {!service.active ? <Badge>Inativo</Badge> : null}
                    </div>
                  </div>

                  {service.shortPitch ? (
                    <p className="text-sm leading-relaxed text-ink-600">{service.shortPitch}</p>
                  ) : null}

                  {service.basePriceCents ? (
                    <p className="text-sm tabular text-ink-700">
                      A partir de {formatBRL(service.basePriceCents)}
                      {service.priceNote ? (
                        <span className="text-ink-400"> · {service.priceNote}</span>
                      ) : null}
                    </p>
                  ) : (
                    <p className="text-sm text-ink-400">Preço sob consulta</p>
                  )}

                  {!availability.allowed ? (
                    <p className="rounded-control border border-danger/25 bg-danger-soft px-3 py-2 text-xs leading-relaxed text-danger">
                      {availability.reason}
                    </p>
                  ) : availability.requiresDisclosure && availability.reason ? (
                    <p className="rounded-control border border-ink-200 bg-ink-50 px-3 py-2 text-xs leading-relaxed text-ink-600">
                      {availability.reason}
                    </p>
                  ) : null}
                </CardBody>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="space-y-3">
        <SectionHeading title="Modelos de checklist" />
        <div className="grid gap-3 lg:grid-cols-3">
          {templates.map((template) => (
            <Card key={template.id}>
              <CardHeader
                title={template.name}
                description={`${template.rooms.length} ambientes · ${template.rooms.reduce(
                  (total, room) => total + room._count.items,
                  0,
                )} itens`}
                action={template.isDefault ? <Badge tone="brand">Padrão</Badge> : undefined}
              />
              <CardBody>
                <ul className="space-y-1">
                  {template.rooms.map((room) => (
                    <li
                      key={room.id}
                      className="flex items-baseline justify-between gap-2 text-sm"
                    >
                      <span className="truncate text-ink-700">{room.name}</span>
                      <span className="shrink-0 text-xs tabular text-ink-400">
                        {room._count.items}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <SectionHeading title={`Problemas comuns (${findings.length})`} />
        <div className="grid gap-3 lg:grid-cols-2">
          {[...findingsByCategory.entries()].map(([category, items]) => (
            <Card key={category}>
              <CardHeader
                title={
                  findingCategoryLabels[category as FindingCategory] ?? category
                }
                description={`${items.length} ${items.length === 1 ? "registro" : "registros"}`}
              />
              <ul className="divide-y divide-ink-100">
                {items.map((finding) => (
                  <li key={finding.id} className="px-4 py-2.5 sm:px-5">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm text-ink-800">{finding.title}</p>
                      <Badge tone={severityTones[finding.defaultSeverity as Severity]}>
                        {severityLabels[finding.defaultSeverity as Severity]}
                      </Badge>
                    </div>
                    {finding.defaultDescription ? (
                      <p className="mt-1 text-xs leading-relaxed text-ink-500">
                        {finding.defaultDescription}
                      </p>
                    ) : null}
                    {finding.usageCount > 0 ? (
                      <p className="mt-1 text-xs text-ink-400">
                        usado {finding.usageCount}×
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
