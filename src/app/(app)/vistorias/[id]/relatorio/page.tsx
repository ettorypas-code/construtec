import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FileDown, TriangleAlert } from "lucide-react";
import { requireUser } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { getCompanySettings } from "@/lib/services/catalog";
import { resolveDocument } from "@/lib/compliance";
import { getInspectionOverview } from "@/lib/services/inspections";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/states";
import { DeleteButton } from "@/components/ui/delete-button";
import { SeveritySummary } from "@/components/inspection/severity-summary";
import { GenerateReportButton } from "@/components/inspection/generate-report-button";
import { deleteReportAction } from "../../actions-report";
import { formatDateTime } from "@/lib/utils/dates";
import { documentKindLabels } from "@/domain/labels";
import { InspectionStatus } from "@/domain/enums";

export const metadata: Metadata = { title: "Relatório da vistoria" };

export default async function InspectionReportPage(
  props: PageProps<"/vistorias/[id]/relatorio">,
) {
  await requireUser();
  const { id } = await props.params;

  const [inspection, company] = await Promise.all([
    getInspectionOverview(id),
    getCompanySettings(),
  ]);

  if (!inspection) notFound();

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

  const reports = await db.report.findMany({
    where: { inspectionId: id },
    orderBy: { generatedAt: "desc" },
  });

  const canGenerate = inspection.status !== InspectionStatus.AGENDADA;

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <PageHeader
        title="Relatório"
        description={`${inspection.code} · ${inspection.title}`}
        backHref={`/vistorias/${id}`}
        backLabel="Vistoria"
      />

      <Card>
        <CardHeader
          title="O que será emitido"
          description="Definido pelo serviço e pela habilitação profissional configurada."
        />
        <CardBody className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="brand">{documentKindLabels[resolution.documentKind]}</Badge>
            {resolution.downgraded ? <Badge tone="warning">Tipo ajustado</Badge> : null}
          </div>

          {resolution.downgradeReason ? (
            <p className="flex items-start gap-2 rounded-control border border-warning/25 bg-warning-soft px-3 py-2.5 text-sm leading-relaxed text-ink-700">
              <TriangleAlert className="mt-0.5 size-4 shrink-0 text-warning" />
              {resolution.downgradeReason}
            </p>
          ) : null}

          {resolution.warnings.map((warning) => (
            <p
              key={warning}
              className="rounded-control border border-ink-200 bg-ink-50 px-3 py-2.5 text-sm leading-relaxed text-ink-600"
            >
              {warning}
            </p>
          ))}

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
              Aviso legal que constará no documento
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-600">
              {resolution.legalNotice}
            </p>
          </div>

          <SeveritySummary tally={inspection.severityTally} />

          <div className="pt-1">
            {canGenerate ? (
              <GenerateReportButton
                inspectionId={id}
                hasPrevious={reports.length > 0}
              />
            ) : (
              <p className="text-sm text-ink-500">
                Inicie a vistoria antes de gerar o documento.
              </p>
            )}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Documentos emitidos" />
        {reports.length === 0 ? (
          <EmptyState
            icon={<FileDown className="size-5" />}
            title="Nenhum documento emitido"
            description="Ao gerar, o arquivo fica registrado aqui com número e versão."
          />
        ) : (
          <ul className="divide-y divide-ink-100">
            {reports.map((report) => (
              /* O excluir fica fora do link: aninhar botão dentro de âncora
                 quebra o clique nos dois. */
              <li key={report.id} className="flex items-center gap-1 pr-2 sm:pr-3">
                <a
                  href={`/api/relatorios/${report.id}/pdf`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex min-w-0 flex-1 items-center justify-between gap-3 rounded-control px-4 py-3.5 transition-colors hover:bg-ink-50 sm:px-5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink-900">
                      {report.number}
                      <span className="ml-2 text-xs font-normal text-ink-400">
                        versão {report.version}
                      </span>
                    </p>
                    <p className="mt-0.5 truncate text-xs text-ink-500">
                      {documentKindLabels[
                        report.documentKind as keyof typeof documentKindLabels
                      ] ?? report.documentKind}{" "}
                      · {formatDateTime(report.generatedAt)}
                    </p>
                  </div>
                  <FileDown className="size-4 shrink-0 text-ink-400" />
                </a>

                <DeleteButton
                  action={deleteReportAction}
                  id={report.id}
                  title="Excluir documento"
                  entityLabel={`${report.number} (versão ${report.version})`}
                  triggerLabel="Excluir documento"
                  successMessage="Documento excluído."
                  consequences={[
                    "O arquivo PDF, apagado do armazenamento",
                    "O número e o registro desta versão",
                    "O link público, que para de abrir",
                  ]}
                  warning={
                    report.sentAt
                      ? `Este documento foi enviado ao cliente em ${formatDateTime(report.sentAt)}. O link que ele recebeu vai parar de funcionar.`
                      : "A vistoria não é afetada — dá para gerar o documento de novo a qualquer momento."
                  }
                />
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
