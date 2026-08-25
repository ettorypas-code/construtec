import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, FileDown, Info, MapPin, RotateCcw, TriangleAlert } from "lucide-react";
import { requireUser } from "@/lib/auth/guards";
import { getInspectionOverview } from "@/lib/services/inspections";
import { getCompanySettings } from "@/lib/services/catalog";
import { resolveDocument } from "@/lib/compliance";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/states";
import { DeleteButton } from "@/components/ui/delete-button";
import { SeveritySummary } from "@/components/inspection/severity-summary";
import { RevisitSheet } from "@/components/inspection/revisit-sheet";
import {
  AddRoomSheet,
  FinishInspectionSheet,
  StartInspectionButton,
} from "@/components/inspection/inspection-actions";
import { deleteInspectionAction } from "../actions";
import { formatDate, formatDateTime } from "@/lib/utils/dates";
import {
  ChecklistItemStatus,
  InspectionStatus,
  type Severity,
} from "@/domain/enums";
import {
  documentKindLabels,
  findingCategoryLabels,
  inspectionStatusLabels,
  inspectionStatusTones,
  severityLabels,
  severityTones,
} from "@/domain/labels";

export async function generateMetadata(props: PageProps<"/vistorias/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  const inspection = await getInspectionOverview(id);
  return { title: inspection ? `${inspection.code} — ${inspection.title}` : "Vistoria" };
}

export default async function InspectionPage(props: PageProps<"/vistorias/[id]">) {
  await requireUser();
  const { id } = await props.params;

  const [inspection, company] = await Promise.all([
    getInspectionOverview(id),
    getCompanySettings(),
  ]);

  if (!inspection) notFound();

  const status = inspection.status as InspectionStatus;

  const resolution = resolveDocument({
    requestedKind: inspection.documentKind,
    service: inspection.serviceType
      ? {
          name: inspection.serviceType.name,
          restrictionLevel: inspection.serviceType.restrictionLevel,
          requiresTechnicalResponsible: inspection.serviceType.requiresTechnicalResponsible,
          requiresArtRrt: inspection.serviceType.requiresArtRrt,
          legalNotes: inspection.serviceType.legalNotes,
          defaultDocumentKind: inspection.serviceType.defaultDocumentKind,
        }
      : null,
    credentials: company,
  });

  const pendingChecklistCount = inspection.rooms.reduce(
    (total, room) =>
      total + room.items.filter((item) => item.status === ChecklistItemStatus.PENDENTE).length,
    0,
  );

  const isFinished = status === InspectionStatus.CONCLUIDA;
  const latestReport = inspection.reports[0] ?? null;

  const photoCount =
    inspection.itemPhotoCount +
    inspection.findings.reduce((total, finding) => total + finding.media.length, 0);

  const problemItemCount = inspection.problemItemCount;
  const revisitableCount = problemItemCount + inspection.openFindingCount;
  const isRevisit = Boolean(inspection.parentInspectionId);

  // Vistoria com trabalho dentro exige digitar o código. Refazer significa
  // voltar ao imóvel — que depois da entrega das chaves pode não ser mais
  // possível. Vistoria vazia (a criada por engano) sai com um clique.
  const temTrabalho = photoCount > 0 || inspection.findings.length > 0;

  return (
    <div className="space-y-5">
      <PageHeader
        title={inspection.title}
        backHref="/vistorias"
        backLabel="Vistorias"
        description={
          <span className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs text-ink-400">{inspection.code}</span>
            <Badge tone={inspectionStatusTones[status]} dot>
              {inspectionStatusLabels[status]}
            </Badge>
            {inspection.client ? (
              <Link
                href={`/clientes/${inspection.client.id}`}
                className="text-brand-600 hover:text-brand-700"
              >
                {inspection.client.name}
              </Link>
            ) : null}
          </span>
        }
        action={
          <>
            {isFinished ? (
              <ButtonLink href={`/vistorias/${inspection.id}/relatorio`}>
                <FileDown className="size-4" />
                {latestReport ? "Ver relatório" : "Gerar relatório"}
              </ButtonLink>
            ) : status === InspectionStatus.AGENDADA ? (
              <StartInspectionButton inspectionId={inspection.id} />
            ) : (
              <FinishInspectionSheet
                inspectionId={inspection.id}
                findingCount={inspection.findings.length}
                pendingChecklistCount={pendingChecklistCount}
              />
            )}

            {isFinished && !isRevisit && revisitableCount > 0 ? (
              <RevisitSheet
                inspectionId={inspection.id}
                parentCode={inspection.code}
                itemCount={problemItemCount}
                findingCount={inspection.openFindingCount}
              />
            ) : null}

            <DeleteButton
              action={deleteInspectionAction}
              id={inspection.id}
              title="Excluir vistoria"
              entityLabel={`${inspection.code} — ${inspection.title}`}
              triggerLabel="Excluir vistoria"
              confirmLabel="Excluir"
              confirmWord={temTrabalho ? inspection.code : null}
              successMessage="Vistoria excluída."
              redirectTo="/vistorias"
              consequences={[
                `${inspection.rooms.length} ambiente(s) e todo o checklist preenchido`,
                `${inspection.findings.length} ocorrência(s) registrada(s)`,
                `${photoCount} foto(s) — apagadas também do armazenamento`,
                inspection.reports.length > 0
                  ? `${inspection.reports.length} documento(s) emitido(s), com os links já enviados`
                  : "Nenhum documento emitido",
                "O compromisso na agenda e as tarefas abertas sobre ela",
                ...(inspection.revisits.length > 0
                  ? [
                      `As ${inspection.revisits.length} revistoria(s) continuam, mas perdem as fotos do "antes"`,
                    ]
                  : []),
              ]}
              warning={
                temTrabalho
                  ? "Refazer esta vistoria exige voltar ao imóvel. Se as chaves já foram entregues, o acesso pode não existir mais."
                  : undefined
              }
            />
          </>
        }
      />

      {/* Numa revistoria, saber de onde ela veio é a primeira informação:
          sem isso a tela é um checklist curto e sem explicação. */}
      {inspection.parent ? (
        <Card className="border-brand-200 bg-brand-50/40">
          <CardBody className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <RotateCcw className="size-4 shrink-0 text-brand-600" />
            <span className="text-sm text-ink-700">
              Revistoria de conferência das correções apontadas em
            </span>
            <Link
              href={`/vistorias/${inspection.parent.id}`}
              className="text-sm font-medium text-brand-700 hover:text-brand-800"
            >
              {inspection.parent.code}
            </Link>
          </CardBody>
        </Card>
      ) : null}

      {/* Guarda de terminologia: o que o sistema vai emitir e por quê. */}
      {resolution.downgraded || resolution.warnings.length > 0 ? (
        <Card className="border-warning/25 bg-warning-soft">
          <CardBody className="space-y-2">
            <p className="flex items-center gap-2 text-sm font-semibold text-warning">
              <TriangleAlert className="size-4 shrink-0" />
              Habilitação profissional
            </p>
            {resolution.downgradeReason ? (
              <p className="text-sm leading-relaxed text-ink-700">{resolution.downgradeReason}</p>
            ) : null}
            {resolution.warnings.map((warning) => (
              <p key={warning} className="text-sm leading-relaxed text-ink-700">
                {warning}
              </p>
            ))}
            <Link
              href="/configuracoes"
              className="inline-block text-sm font-medium text-brand-700 hover:text-brand-800"
            >
              Configurar responsável técnico
            </Link>
          </CardBody>
        </Card>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[1fr_18rem]">
        <div className="space-y-4">
          <Card>
            <CardHeader
              title="Não conformidades"
              description={`${inspection.findings.length} no total`}
            />
            <CardBody>
              <SeveritySummary tally={inspection.severityTally} />
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Ambientes"
              description="Toque para vistoriar"
              action={<AddRoomSheet inspectionId={inspection.id} />}
            />
            {inspection.rooms.length === 0 ? (
              <EmptyState
                icon={<MapPin className="size-5" />}
                title="Nenhum ambiente"
                description="Adicione ambientes manualmente ou crie a vistoria a partir de um modelo de checklist."
              />
            ) : (
              <ul className="divide-y divide-ink-100">
                {inspection.rooms.map((room) => {
                  const pending = room.items.filter(
                    (item) => item.status === ChecklistItemStatus.PENDENTE,
                  ).length;
                  const critical = room.findings.filter(
                    (finding) => finding.severity === "CRITICA",
                  ).length;

                  return (
                    <li key={room.id}>
                      <Link
                        href={`/vistorias/${inspection.id}/ambiente/${room.id}`}
                        className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-ink-50 sm:px-5"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-ink-900">{room.name}</p>
                          <p className="mt-0.5 text-xs text-ink-500">
                            {room.items.length > 0
                              ? pending === 0
                                ? `${room.items.length} itens · checklist completo`
                                : `${pending} de ${room.items.length} itens pendentes`
                              : "Sem checklist"}
                          </p>
                        </div>

                        {room.findings.length > 0 ? (
                          <Badge tone={critical > 0 ? "critical" : "warning"}>
                            {room.findings.length}
                          </Badge>
                        ) : null}
                        <ChevronRight className="size-4 shrink-0 text-ink-300" />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          <Card>
            <CardHeader title="Todas as ocorrências" />
            {inspection.findings.length === 0 ? (
              <EmptyState
                icon={<Info className="size-5" />}
                title="Nenhuma ocorrência registrada"
                description="Entre em um ambiente e use o botão Adicionar ocorrência."
              />
            ) : (
              <ul className="divide-y divide-ink-100">
                {inspection.findings.map((finding, index) => (
                  <li key={finding.id} className="px-4 py-3.5 sm:px-5">
                    <div className="flex items-start gap-3">
                      <span className="w-6 shrink-0 pt-0.5 text-xs tabular text-ink-400">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-medium text-ink-900">{finding.title}</p>
                          <Badge tone={severityTones[finding.severity as Severity]}>
                            {severityLabels[finding.severity as Severity]}
                          </Badge>
                        </div>
                        <p className="mt-0.5 text-xs text-ink-500">
                          {[
                            finding.room?.name,
                            findingCategoryLabels[
                              finding.category as keyof typeof findingCategoryLabels
                            ] ?? finding.category,
                            finding.locationNote,
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                        {finding.description ? (
                          <p className="mt-1.5 text-sm leading-relaxed text-ink-600">
                            {finding.description}
                          </p>
                        ) : null}

                        {finding.media.length > 0 ? (
                          <ul className="mt-2 flex gap-1.5 overflow-x-auto scrollbar-none">
                            {finding.media.map((asset) => (
                              <li key={asset.id} className="shrink-0">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={`/api/arquivos/${asset.storageKey}`}
                                  alt={asset.caption ?? finding.title}
                                  className="size-16 rounded-control border border-ink-200 object-cover"
                                />
                              </li>
                            ))}
                          </ul>
                        ) : null}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <aside className="space-y-4">
          <Card>
            <CardHeader title="Dados" />
            <CardBody className="space-y-2.5 text-sm">
              <Detail label="Documento" value={documentKindLabels[resolution.documentKind]} />
              <Detail label="Imóvel" value={inspection.propertyLabel ?? "—"} />
              <Detail label="Serviço" value={inspection.serviceType?.name ?? "—"} />
              <Detail
                label="Agendada"
                value={inspection.scheduledAt ? formatDateTime(inspection.scheduledAt) : "—"}
              />
              <Detail
                label="Iniciada"
                value={inspection.startedAt ? formatDateTime(inspection.startedAt) : "—"}
              />
              <Detail
                label="Concluída"
                value={inspection.finishedAt ? formatDateTime(inspection.finishedAt) : "—"}
              />
              {inspection.contactName ? (
                <Detail label="Contato no local" value={inspection.contactName} />
              ) : null}
            </CardBody>
          </Card>

          {inspection.reports.length > 0 ? (
            <Card>
              <CardHeader title="Documentos emitidos" />
              <ul className="divide-y divide-ink-100">
                {inspection.reports.map((report) => (
                  <li key={report.id}>
                    <a
                      href={`/api/relatorios/${report.id}/pdf`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between gap-2 px-4 py-3 transition-colors hover:bg-ink-50 sm:px-5"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-ink-800">
                          {report.number}
                        </p>
                        <p className="text-xs text-ink-500">
                          {formatDate(report.generatedAt)} · v{report.version}
                        </p>
                      </div>
                      <FileDown className="size-4 shrink-0 text-ink-400" />
                    </a>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}

          {inspection.revisits.length > 0 ? (
            <Card>
              <CardHeader title="Revistorias" />
              <ul className="divide-y divide-ink-100">
                {inspection.revisits.map((revisit) => (
                  <li key={revisit.id}>
                    <Link
                      href={`/vistorias/${revisit.id}`}
                      className="flex items-center justify-between gap-2 px-4 py-3 transition-colors hover:bg-ink-50 sm:px-5"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-ink-800">
                          {revisit.code}
                        </p>
                        <p className="text-xs text-ink-500">
                          {revisit.scheduledAt ? formatDate(revisit.scheduledAt) : "Sem data"}
                        </p>
                      </div>
                      <Badge
                        tone={inspectionStatusTones[revisit.status as InspectionStatus]}
                        dot
                      >
                        {inspectionStatusLabels[revisit.status as InspectionStatus]}
                      </Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}

          {inspection.summaryText ? (
            <Card>
              <CardHeader title="Resumo" />
              <CardBody>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink-700">
                  {inspection.summaryText}
                </p>
              </CardBody>
            </Card>
          ) : null}
        </aside>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="shrink-0 text-ink-500">{label}</span>
      <span className="text-right font-medium text-ink-800">{value}</span>
    </div>
  );
}
