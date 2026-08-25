import "server-only";

import { renderToBuffer } from "@react-pdf/renderer";
import { db } from "@/lib/db";
import { storage } from "@/lib/storage";
import { logActivity } from "@/lib/services/activity";
import { emit } from "@/lib/automation/engine";
import { BusinessError } from "@/lib/actions/result";
import { getCompanySettings } from "@/lib/services/catalog";
import { describeProperty } from "@/lib/services/clients";
import { resolveDocument } from "@/lib/compliance";
import { tallySeverities } from "@/lib/services/inspections";
import { formatDate } from "@/lib/utils/dates";
import { ChecklistItemStatus, DocumentKind } from "@/domain/enums";
import { checklistItemStatusLabels } from "@/domain/labels";
import {
  InspectionReportDocument,
  type InspectionReportData,
  type ReportPhoto,
} from "@/lib/pdf/inspection-report";

/**
 * Geração de documentos.
 *
 * Fluxo: guarda de terminologia → montagem dos dados → render → storage →
 * registro. O `legalNotice` é gravado junto com o Report: o documento entregue
 * ao cliente não pode mudar de sentido se a configuração da empresa mudar
 * depois.
 */

/** react-pdf só embute JPEG e PNG. HEIC e WEBP são ignorados na montagem. */
const EMBEDDABLE = new Set(["image/jpeg", "image/jpg", "image/png"]);

/** Lê os bytes das imagens que o PDF consegue embutir, ignorando o resto. */
async function loadPhotos(
  media: Array<{ storageKey: string; mimeType: string; caption: string | null }>,
): Promise<ReportPhoto[]> {
  const embeddable = media.filter((asset) => EMBEDDABLE.has(asset.mimeType));
  const photos = await Promise.all(
    embeddable.map(async (asset): Promise<ReportPhoto | null> => {
      const data = await storage.get(asset.storageKey);
      if (!data) return null;
      return {
        data,
        format: asset.mimeType === "image/png" ? "png" : "jpg",
        caption: asset.caption,
      };
    }),
  );
  return photos.filter((photo): photo is ReportPhoto => photo !== null);
}

async function nextReportNumber(): Promise<string> {
  const settings = await getCompanySettings();
  const year = new Date().getFullYear();
  const sequence = settings.reportNumberSequence;

  await db.companySettings.update({
    where: { id: settings.id },
    data: { reportNumberSequence: sequence + 1 },
  });

  return `REL-${year}-${String(sequence).padStart(4, "0")}`;
}

export async function generateInspectionReport(inspectionId: string, userId: string) {
  const [inspection, company] = await Promise.all([
    db.inspection.findUnique({
      where: { id: inspectionId },
      include: {
        client: true,
        property: true,
        serviceType: true,
        rooms: {
          orderBy: { sortOrder: "asc" },
          include: {
            items: {
              orderBy: { sortOrder: "asc" },
              include: { media: { orderBy: { sortOrder: "asc" } } },
            },
          },
        },
        findings: {
          orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
          include: {
            room: { select: { id: true, name: true } },
            media: { orderBy: { sortOrder: "asc" } },
          },
        },
      },
    }),
    getCompanySettings(),
  ]);

  if (!inspection) throw new BusinessError("Vistoria não encontrada.");

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

  // Fotos são lidas em paralelo: um relatório de apartamento novo pode passar
  // de 80 imagens somando ocorrências e estado dos itens, e ler em série
  // multiplicaria o tempo de geração.
  const photosByFinding = new Map<string, ReportPhoto[]>();
  const photosByItem = new Map<string, ReportPhoto[]>();

  await Promise.all([
    ...inspection.findings.map(async (finding) => {
      photosByFinding.set(finding.id, await loadPhotos(finding.media));
    }),
    ...inspection.rooms.flatMap((room) =>
      room.items.map(async (item) => {
        if (item.media.length > 0) photosByItem.set(item.id, await loadPhotos(item.media));
      }),
    ),
  ]);

  let findingIndex = 0;
  const rooms = inspection.rooms.map((room) => ({
    name: room.name,
    checklist: room.items.map((item) => ({
      label: item.label,
      status: item.status,
      photos: photosByItem.get(item.id) ?? [],
    })),
    findings: inspection.findings
      .filter((finding) => finding.roomId === room.id)
      .map((finding) => ({
        index: ++findingIndex,
        title: finding.title,
        description: finding.description,
        category: finding.category,
        severity: finding.severity,
        status: finding.status,
        locationNote: finding.locationNote,
        photos: photosByFinding.get(finding.id) ?? [],
      })),
  }));

  // Ocorrências sem ambiente vinculado não podem sumir do documento.
  const orphanFindings = inspection.findings.filter((finding) => !finding.roomId);
  if (orphanFindings.length > 0) {
    rooms.push({
      name: "Outros registros",
      checklist: [],
      findings: orphanFindings.map((finding) => ({
        index: ++findingIndex,
        title: finding.title,
        description: finding.description,
        category: finding.category,
        severity: finding.severity,
        status: finding.status,
        locationNote: finding.locationNote,
        photos: photosByFinding.get(finding.id) ?? [],
      })),
    });
  }

  const pendingChecklist = inspection.rooms.flatMap((room) =>
    room.items
      .filter((item) => item.status === ChecklistItemStatus.PENDENTE)
      .map((item) => ({ room: room.name, label: item.label })),
  );

  const inspectedAt = inspection.finishedAt ?? inspection.scheduledAt ?? inspection.createdAt;
  const number = await nextReportNumber();

  const data: InspectionReportData = {
    documentTitle: resolution.title,
    reportNumber: number,
    legalNotice: resolution.legalNotice,
    company: {
      name: company.name,
      document: company.document,
      phone: company.phone,
      email: company.email,
      professionalLine:
        company.councilNumber && company.councilType !== "NENHUM"
          ? `${company.councilType} ${company.councilNumber}`
          : null,
    },
    inspection: {
      code: inspection.code,
      title: inspection.title,
      clientName: inspection.client?.name ?? null,
      propertyLabel: inspection.property ? describeProperty(inspection.property) : null,
      propertyAddress: inspection.property
        ? [inspection.property.addressLine, inspection.property.district, inspection.property.city]
            .filter(Boolean)
            .join(", ") || null
        : null,
      serviceName: inspection.serviceType?.name ?? null,
      inspectedAt: formatDate(inspectedAt),
      inspectorName: inspection.inspectorName ?? company.professionalName ?? company.name,
      contactName: inspection.contactName,
      summaryText: inspection.summaryText,
    },
    severityTally: tallySeverities(inspection.findings),
    totalFindings: inspection.findings.length,
    rooms,
    pendingChecklist,
    statusLabels: checklistItemStatusLabels,
    itemPhotoCount: [...photosByItem.values()].reduce((total, list) => total + list.length, 0),
    showChecklist:
      resolution.documentKind === DocumentKind.CHECKLIST_ENTREGA ||
      resolution.documentKind === DocumentKind.RELATORIO_VISTORIA,
  };

  const buffer = await renderToBuffer(<InspectionReportDocument data={data} />);

  const stored = await storage.put({
    folder: "relatorios",
    fileName: `${number}.pdf`,
    mimeType: "application/pdf",
    data: Buffer.from(buffer),
  });

  const previousVersions = await db.report.count({ where: { inspectionId } });

  const report = await db.report.create({
    data: {
      number,
      title: `${resolution.title} — ${inspection.title}`,
      documentKind: resolution.documentKind,
      status: "GERADO",
      version: previousVersions + 1,
      inspectionId: inspection.id,
      storageKey: stored.key,
      publicToken: crypto.randomUUID(),
      legalNotice: resolution.legalNotice,
    },
  });

  await logActivity({
    userId,
    action: "report.generated",
    summary: `Relatório gerado: ${report.number} (${inspection.code})`,
    entityType: "Report",
    entityId: report.id,
  });

  await emit({
    type: "RELATORIO_GERADO",
    reportId: report.id,
    reportTitle: report.number,
    inspectionId: inspection.id,
  });

  return report;
}

export async function getReport(id: string) {
  return db.report.findUnique({
    where: { id },
    include: { inspection: { select: { id: true, code: true, title: true } } },
  });
}

export async function getReportByToken(token: string) {
  return db.report.findUnique({
    where: { publicToken: token },
    include: { inspection: { select: { code: true, title: true } } },
  });
}

export async function markReportSent(id: string, userId: string) {
  const report = await db.report.update({
    where: { id },
    data: { status: "ENVIADO", sentAt: new Date() },
  });

  await logActivity({
    userId,
    action: "report.sent",
    summary: `Relatório enviado ao cliente: ${report.number}`,
    entityType: "Report",
    entityId: report.id,
  });

  return report;
}
