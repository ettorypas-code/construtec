import type { Metadata } from "next";
import Link from "next/link";
import { ClipboardCheck } from "lucide-react";
import { requireUser } from "@/lib/auth/guards";
import { listInspections } from "@/lib/services/inspections";
import { PageHeader } from "@/components/ui/page-header";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/states";
import { cn } from "@/lib/utils/cn";
import { formatDate } from "@/lib/utils/dates";
import { InspectionStatus } from "@/domain/enums";
import { inspectionStatusLabels, inspectionStatusTones } from "@/domain/labels";

export const metadata: Metadata = { title: "Vistorias" };

const filters = [
  { value: "", label: "Todas" },
  { value: InspectionStatus.AGENDADA, label: "Agendadas" },
  { value: InspectionStatus.EM_ANDAMENTO, label: "Em andamento" },
  { value: InspectionStatus.CONCLUIDA, label: "Concluídas" },
];

export default async function InspectionsPage(props: PageProps<"/vistorias">) {
  await requireUser();

  const searchParams = await props.searchParams;
  const rawStatus = searchParams.status;
  const status = typeof rawStatus === "string" && rawStatus !== "" ? rawStatus : undefined;

  const inspections = await listInspections(status);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Vistorias"
        description="Entrega de chaves, locação e acompanhamento."
        action={<ButtonLink href="/vistorias/nova">Nova vistoria</ButtonLink>}
      />

      <nav className="-mx-4 flex gap-2 overflow-x-auto px-4 scrollbar-none sm:mx-0 sm:px-0">
        {filters.map((filter) => {
          const active = (status ?? "") === filter.value;
          return (
            <Link
              key={filter.value || "todas"}
              href={filter.value ? `/vistorias?status=${filter.value}` : "/vistorias"}
              className={cn(
                "shrink-0 rounded-full border px-3.5 py-1.5 text-sm transition-colors",
                active
                  ? "border-brand-600 bg-brand-600 font-medium text-white"
                  : "border-ink-200 bg-surface text-ink-600 hover:bg-ink-50",
              )}
            >
              {filter.label}
            </Link>
          );
        })}
      </nav>

      {inspections.length === 0 ? (
        <Card>
          <EmptyState
            icon={<ClipboardCheck className="size-5" />}
            title={status ? "Nenhuma vistoria neste estado" : "Nenhuma vistoria ainda"}
            description={
              status
                ? "Troque o filtro para ver as demais."
                : "Crie a primeira vistoria: o checklist do imóvel é montado a partir do modelo."
            }
            action={
              status ? (
                <ButtonLink href="/vistorias" variant="outline" size="sm">
                  Ver todas
                </ButtonLink>
              ) : (
                <ButtonLink href="/vistorias/nova">Nova vistoria</ButtonLink>
              )
            }
          />
        </Card>
      ) : (
        <Card>
          <ul className="divide-y divide-ink-100">
            {inspections.map((inspection) => (
              <li key={inspection.id}>
                <Link
                  href={`/vistorias/${inspection.id}`}
                  className="flex items-start gap-3 px-4 py-3.5 transition-colors hover:bg-ink-50 sm:px-5"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-medium text-ink-900">
                        {inspection.title}
                      </p>
                      <Badge
                        tone={
                          inspectionStatusTones[inspection.status as InspectionStatus] ?? "neutral"
                        }
                      >
                        {inspectionStatusLabels[inspection.status as InspectionStatus] ??
                          inspection.status}
                      </Badge>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-ink-500">
                      {[
                        inspection.code,
                        inspection.clientName,
                        inspection.propertyLabel,
                        inspection.scheduledAt ? formatDate(inspection.scheduledAt) : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>

                  {inspection.findingCount > 0 ? (
                    <div className="flex shrink-0 items-center gap-1.5">
                      {inspection.criticalCount > 0 ? (
                        <Badge tone="critical">{inspection.criticalCount} crítica</Badge>
                      ) : null}
                      <Badge>{inspection.findingCount} ocorr.</Badge>
                    </div>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
