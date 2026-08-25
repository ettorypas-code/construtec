import "server-only";

import { db } from "@/lib/db";
import { logActivity } from "@/lib/services/activity";
import { emit } from "@/lib/automation/engine";
import { BusinessError } from "@/lib/actions/result";
import { storage } from "@/lib/storage";
import { describeProperty } from "@/lib/services/clients";
import {
  ChecklistItemStatus,
  InspectionStatus,
  isProblemStatus,
  RatingScale,
  Severity,
  SEVERITY_ORDER,
  type FindingStatus,
} from "@/domain/enums";

export type InspectionListItem = {
  id: string;
  code: string;
  title: string;
  status: string;
  scheduledAt: Date | null;
  clientName: string | null;
  propertyLabel: string | null;
  findingCount: number;
  criticalCount: number;
};

export type SeverityTally = Record<Severity, number>;

/** Código legível e crescente por ano: VST-2026-0007. */
async function nextInspectionCode(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `VST-${year}-`;

  const last = await db.inspection.findFirst({
    where: { code: { startsWith: prefix } },
    orderBy: { code: "desc" },
    select: { code: true },
  });

  const lastNumber = last ? Number.parseInt(last.code.slice(prefix.length), 10) : 0;
  const next = Number.isFinite(lastNumber) ? lastNumber + 1 : 1;
  return `${prefix}${String(next).padStart(4, "0")}`;
}

export async function listInspections(status?: string): Promise<InspectionListItem[]> {
  const inspections = await db.inspection.findMany({
    where: status ? { status } : undefined,
    orderBy: [{ scheduledAt: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      code: true,
      title: true,
      status: true,
      scheduledAt: true,
      client: { select: { name: true } },
      property: {
        select: { development: true, tower: true, unit: true, addressLine: true, city: true },
      },
      findings: { select: { severity: true } },
    },
  });

  return inspections.map((inspection) => ({
    id: inspection.id,
    code: inspection.code,
    title: inspection.title,
    status: inspection.status,
    scheduledAt: inspection.scheduledAt,
    clientName: inspection.client?.name ?? null,
    propertyLabel: inspection.property ? describeProperty(inspection.property) : null,
    findingCount: inspection.findings.length,
    criticalCount: inspection.findings.filter((f) => f.severity === Severity.CRITICA).length,
  }));
}

/**
 * Cria a vistoria e materializa o checklist.
 *
 * Os ambientes e itens são copiados do modelo para a vistoria em vez de
 * referenciados. Assim, editar um modelo no futuro não altera o conteúdo de
 * uma vistoria já realizada — o documento entregue tem que ficar estável.
 */
export async function createInspection(
  input: {
    title: string;
    clientId: string | null;
    propertyId: string | null;
    serviceTypeId: string | null;
    templateId: string | null;
    scheduledAt: Date | null;
    documentKind: string;
    contactName: string | null;
    contactPhone: string | null;
    notes: string | null;
  },
  userId: string,
) {
  const template = input.templateId
    ? await db.checklistTemplate.findUnique({
        where: { id: input.templateId },
        include: { rooms: { include: { items: true }, orderBy: { sortOrder: "asc" } } },
      })
    : null;

  const code = await nextInspectionCode();

  const inspection = await db.inspection.create({
    data: {
      code,
      // A escala é copiada do modelo, não referenciada: editar o modelo depois
      // não pode mudar como uma vistoria já realizada foi avaliada.
      ratingScale: template?.ratingScale ?? RatingScale.ESTADO,
      title: input.title,
      clientId: input.clientId,
      propertyId: input.propertyId,
      serviceTypeId: input.serviceTypeId,
      templateId: input.templateId,
      scheduledAt: input.scheduledAt,
      documentKind: input.documentKind,
      contactName: input.contactName,
      contactPhone: input.contactPhone,
      notes: input.notes,
      status: InspectionStatus.AGENDADA,
      rooms: template
        ? {
            create: template.rooms.map((room) => ({
              name: room.name,
              sortOrder: room.sortOrder,
              items: {
                create: room.items
                  .slice()
                  .sort((a, b) => a.sortOrder - b.sortOrder)
                  .map((item) => ({
                    label: item.label,
                    category: item.category,
                    sortOrder: item.sortOrder,
                  })),
              },
            })),
          }
        : undefined,
    },
  });

  // Uma vistoria agendada é um compromisso: ela nasce na agenda também.
  if (input.scheduledAt) {
    await db.calendarEvent.create({
      data: {
        type: "VISTORIA",
        title: input.title,
        startsAt: input.scheduledAt,
        clientId: input.clientId,
        inspectionId: inspection.id,
      },
    });
  }

  await logActivity({
    userId,
    action: "inspection.created",
    summary: `Vistoria criada: ${inspection.code} — ${inspection.title}`,
    entityType: "Inspection",
    entityId: inspection.id,
  });

  return inspection;
}

/** Visão geral da vistoria: ambientes, contagens e ocorrências. */
export async function getInspectionOverview(id: string) {
  const inspection = await db.inspection.findUnique({
    where: { id },
    include: {
      client: { select: { id: true, name: true, phone: true, whatsapp: true } },
      property: true,
      serviceType: true,
      rooms: {
        orderBy: { sortOrder: "asc" },
        include: {
          items: {
            orderBy: { sortOrder: "asc" },
            include: { media: { orderBy: { sortOrder: "asc" } } },
          },
          findings: { select: { id: true, severity: true, status: true } },
        },
      },
      findings: {
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        include: {
          room: { select: { id: true, name: true } },
          media: { orderBy: { sortOrder: "asc" } },
        },
      },
      reports: { orderBy: { generatedAt: "desc" } },
    },
  });

  if (!inspection) return null;

  return {
    ...inspection,
    propertyLabel: inspection.property ? describeProperty(inspection.property) : null,
    severityTally: tallySeverities(inspection.findings),
    // Itens avaliados como ruim/péssimo/não conforme contam como problema mesmo
    // sem ocorrência aberta — o resumo precisa refletir os dois.
    problemItemCount: inspection.rooms.reduce(
      (total, room) => total + room.items.filter((item) => isProblemStatus(item.status)).length,
      0,
    ),
    itemPhotoCount: inspection.rooms.reduce(
      (total, room) => total + room.items.reduce((sum, item) => sum + item.media.length, 0),
      0,
    ),
  };
}

export async function getRoomForWork(roomId: string) {
  return db.inspectionRoom.findUnique({
    where: { id: roomId },
    include: {
      inspection: {
        select: { id: true, code: true, title: true, status: true, ratingScale: true },
      },
      items: {
        orderBy: { sortOrder: "asc" },
        include: { media: { orderBy: { sortOrder: "asc" } } },
      },
      findings: {
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        include: { media: { orderBy: { sortOrder: "asc" } } },
      },
    },
  });
}

/** Ambientes vizinhos, para o botão "próximo ambiente" no fim da lista. */
export async function getRoomNavigation(inspectionId: string, roomId: string) {
  const rooms = await db.inspectionRoom.findMany({
    where: { inspectionId },
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true },
  });

  const index = rooms.findIndex((room) => room.id === roomId);
  return {
    previous: index > 0 ? rooms[index - 1] : null,
    next: index >= 0 && index < rooms.length - 1 ? rooms[index + 1] : null,
    position: index + 1,
    total: rooms.length,
  };
}

export function tallySeverities(findings: Array<{ severity: string }>): SeverityTally {
  const tally = Object.fromEntries(SEVERITY_ORDER.map((s) => [s, 0])) as SeverityTally;
  for (const finding of findings) {
    if (finding.severity in tally) tally[finding.severity as Severity] += 1;
  }
  return tally;
}

/* --------------------------- Execução da vistoria ------------------------- */

export async function startInspection(id: string, userId: string) {
  const inspection = await db.inspection.update({
    where: { id },
    data: { status: InspectionStatus.EM_ANDAMENTO, startedAt: new Date() },
  });

  await logActivity({
    userId,
    action: "inspection.started",
    summary: `Vistoria iniciada: ${inspection.code}`,
    entityType: "Inspection",
    entityId: inspection.id,
  });

  return inspection;
}

export async function finishInspection(id: string, summaryText: string | null, userId: string) {
  const inspection = await db.inspection.update({
    where: { id },
    data: {
      status: InspectionStatus.CONCLUIDA,
      finishedAt: new Date(),
      summaryText,
    },
  });

  await logActivity({
    userId,
    action: "inspection.finished",
    summary: `Vistoria concluída: ${inspection.code}`,
    entityType: "Inspection",
    entityId: inspection.id,
  });

  await emit({
    type: "VISTORIA_CONCLUIDA",
    inspectionId: inspection.id,
    inspectionTitle: `${inspection.code} — ${inspection.title}`,
  });

  return inspection;
}

export async function setChecklistItemStatus(itemId: string, status: string) {
  return db.inspectionItem.update({ where: { id: itemId }, data: { status } });
}

export async function setChecklistItemNotes(itemId: string, notes: string | null) {
  return db.inspectionItem.update({ where: { id: itemId }, data: { notes } });
}

/**
 * Inclui item fora do modelo.
 *
 * Dois apartamentos de 80 m² podem ter contagens de item muito diferentes —
 * um de alto padrão tem automação, aquecimento, mais louças. Poder incluir em
 * campo evita ter que manter um modelo por padrão de acabamento.
 */
export async function addChecklistItem(
  roomId: string,
  input: { label: string; category: string | null },
) {
  const last = await db.inspectionItem.findFirst({
    where: { roomId },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });

  return db.inspectionItem.create({
    data: {
      roomId,
      label: input.label,
      category: input.category,
      sortOrder: (last?.sortOrder ?? -1) + 1,
      custom: true,
    },
  });
}

/** Remove item que não existe naquele imóvel. As fotos vão junto. */
export async function deleteChecklistItem(itemId: string) {
  const media = await db.mediaAsset.findMany({
    where: { itemId },
    select: { storageKey: true },
  });

  await db.inspectionItem.delete({ where: { id: itemId } });
  await Promise.all(media.map((asset) => storage.remove(asset.storageKey)));
}

/**
 * Anexa fotos a um item do checklist.
 *
 * Diferente da foto de ocorrência: aqui a foto documenta o estado do item —
 * inclusive quando está tudo certo. É o que permite provar depois como o imóvel
 * foi recebido, e não apenas o que estava errado.
 */
export async function attachItemPhotos(itemId: string, keys: string[]) {
  const item = await db.inspectionItem.findUnique({
    where: { id: itemId },
    include: { room: { select: { inspectionId: true } } },
  });
  if (!item) throw new BusinessError("Item não encontrado.");

  const last = await db.mediaAsset.findFirst({
    where: { itemId },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });

  let order = (last?.sortOrder ?? -1) + 1;

  await db.mediaAsset.createMany({
    data: keys.map((key) => ({
      itemId,
      inspectionId: item.room.inspectionId,
      kind: "FOTO",
      storageKey: key,
      fileName: key.split("/").pop() ?? key,
      mimeType: mimeTypeFromKey(key),
      sortOrder: order++,
    })),
  });
}

/**
 * Marca de uma vez todos os itens ainda não avaliados de um ambiente.
 *
 * O valor depende da escala: na conformidade, "Conforme"; na de estado, "Novo",
 * que é o caso normal de um imóvel recém-entregue. Atalho para o vistoriador
 * registrar só as exceções, que é como a vistoria realmente acontece.
 */
export async function markRoomConforming(roomId: string) {
  const room = await db.inspectionRoom.findUnique({
    where: { id: roomId },
    select: { inspection: { select: { ratingScale: true } } },
  });

  const status =
    room?.inspection.ratingScale === RatingScale.CONFORMIDADE
      ? ChecklistItemStatus.OK
      : ChecklistItemStatus.NOVO;

  const result = await db.inspectionItem.updateMany({
    where: { roomId, status: ChecklistItemStatus.PENDENTE },
    data: { status },
  });
  return result.count;
}

export async function addRoom(inspectionId: string, name: string) {
  const last = await db.inspectionRoom.findFirst({
    where: { inspectionId },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });

  return db.inspectionRoom.create({
    data: { inspectionId, name, sortOrder: (last?.sortOrder ?? -1) + 1 },
  });
}

/* ------------------------------ Ocorrências ------------------------------- */

export async function createFinding(
  input: {
    inspectionId: string;
    roomId: string | null;
    category: string;
    title: string;
    description: string | null;
    severity: string;
    locationNote: string | null;
    mediaKeys: string[];
    libraryId: string | null;
  },
  userId: string,
) {
  const inspection = await db.inspection.findUnique({
    where: { id: input.inspectionId },
    select: { id: true, code: true, status: true },
  });
  if (!inspection) throw new BusinessError("Vistoria não encontrada.");

  const last = await db.finding.findFirst({
    where: { inspectionId: input.inspectionId },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });

  const finding = await db.finding.create({
    data: {
      inspectionId: input.inspectionId,
      roomId: input.roomId,
      category: input.category,
      title: input.title,
      description: input.description,
      severity: input.severity,
      locationNote: input.locationNote,
      sortOrder: (last?.sortOrder ?? -1) + 1,
      media: {
        create: input.mediaKeys.map((key, index) => ({
          kind: "FOTO",
          storageKey: key,
          fileName: key.split("/").pop() ?? key,
          mimeType: mimeTypeFromKey(key),
          sortOrder: index,
          inspectionId: input.inspectionId,
        })),
      },
    },
  });

  // Registrar a ocorrência marca o item do checklist como não conforme quando
  // ele existe com o mesmo rótulo — o operador não precisa fazer duas vezes.
  if (input.roomId) {
    await db.inspectionItem.updateMany({
      where: { roomId: input.roomId, label: input.title },
      data: { status: ChecklistItemStatus.NAO_CONFORME },
    });
  }

  if (input.libraryId) {
    await db.findingLibrary.update({
      where: { id: input.libraryId },
      data: { usageCount: { increment: 1 } },
    });
  }

  // A primeira ocorrência registrada coloca a vistoria em andamento.
  if (inspection.status === InspectionStatus.AGENDADA) {
    await db.inspection.update({
      where: { id: inspection.id },
      data: { status: InspectionStatus.EM_ANDAMENTO, startedAt: new Date() },
    });
  }

  await logActivity({
    userId,
    action: "finding.created",
    summary: `Ocorrência em ${inspection.code}: ${input.title}`,
    entityType: "Inspection",
    entityId: inspection.id,
  });

  return finding;
}

export async function updateFinding(
  id: string,
  input: {
    category: string;
    title: string;
    description: string | null;
    severity: string;
    status: string;
    locationNote: string | null;
  },
) {
  return db.finding.update({ where: { id }, data: input });
}

export async function setFindingStatus(id: string, status: FindingStatus) {
  return db.finding.update({ where: { id }, data: { status } });
}

export async function deleteFinding(id: string) {
  const media = await db.mediaAsset.findMany({
    where: { findingId: id },
    select: { storageKey: true },
  });

  await db.finding.delete({ where: { id } });

  // Só apaga os bytes depois que o registro sumiu: se o delete falhar, ainda
  // temos o arquivo; se o arquivo falhar, sobra lixo, que é o problema menor.
  await Promise.all(media.map((asset) => storage.remove(asset.storageKey)));
}

export async function addFindingMedia(findingId: string, keys: string[]) {
  const last = await db.mediaAsset.findFirst({
    where: { findingId },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });

  let order = (last?.sortOrder ?? -1) + 1;

  await db.mediaAsset.createMany({
    data: keys.map((key) => ({
      findingId,
      kind: "FOTO",
      storageKey: key,
      fileName: key.split("/").pop() ?? key,
      mimeType: mimeTypeFromKey(key),
      sortOrder: order++,
    })),
  });
}

/**
 * O tipo real vem da extensão gravada pelo storage. Fixar "image/jpeg" faria a
 * geração de PDF tratar PNG como JPEG e produzir página em branco.
 */
function mimeTypeFromKey(key: string): string {
  const extension = key.slice(key.lastIndexOf(".")).toLowerCase();
  switch (extension) {
    case ".png":
      return "image/png";
    case ".webp":
      return "image/webp";
    case ".heic":
      return "image/heic";
    default:
      return "image/jpeg";
  }
}

export async function removeMedia(id: string) {
  const asset = await db.mediaAsset.findUnique({ where: { id } });
  if (!asset) return;
  await db.mediaAsset.delete({ where: { id } });
  await storage.remove(asset.storageKey);
}

/* ------------------------- Biblioteca de problemas ------------------------ */

export async function listFindingLibrary(category?: string) {
  return db.findingLibrary.findMany({
    where: { active: true, ...(category ? { category } : {}) },
    orderBy: [{ usageCount: "desc" }, { title: "asc" }],
    select: {
      id: true,
      category: true,
      title: true,
      defaultDescription: true,
      defaultSeverity: true,
    },
  });
}
