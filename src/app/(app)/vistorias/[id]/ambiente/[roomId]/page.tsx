import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/guards";
import {
  getRoomForWork,
  getRoomNavigation,
  listFindingLibrary,
} from "@/lib/services/inspections";
import { isAiEnabled } from "@/lib/ai/provider";
import type { RatingScale } from "@/domain/enums";
import { PageHeader } from "@/components/ui/page-header";
import { RoomWork } from "@/components/inspection/room-work";

export async function generateMetadata(
  props: PageProps<"/vistorias/[id]/ambiente/[roomId]">,
): Promise<Metadata> {
  const { roomId } = await props.params;
  const room = await getRoomForWork(roomId);
  return { title: room ? room.name : "Ambiente" };
}

export default async function RoomWorkPage(
  props: PageProps<"/vistorias/[id]/ambiente/[roomId]">,
) {
  await requireUser();
  const { id, roomId } = await props.params;

  const room = await getRoomForWork(roomId);
  if (!room || room.inspection.id !== id) notFound();

  const [navigation, library] = await Promise.all([
    getRoomNavigation(id, roomId),
    listFindingLibrary(),
  ]);

  return (
    <div className="space-y-4">
      <PageHeader
        title={room.name}
        description={`${room.inspection.code} · ${room.inspection.title}`}
        backHref={`/vistorias/${id}`}
        backLabel="Ambientes"
      />

      <RoomWork
        inspectionId={id}
        roomId={room.id}
        roomName={room.name}
        ratingScale={room.inspection.ratingScale as RatingScale}
        items={room.items.map((item) => ({
          id: item.id,
          label: item.label,
          category: item.category,
          status: item.status,
          custom: item.custom,
          photos: item.media.map((asset) => ({ id: asset.id, storageKey: asset.storageKey })),
          before: item.source
            ? {
                // sourceStatus é a cópia congelada; item.source.status é a
                // leitura viva. A cópia manda — ela sobrevive à original.
                status: item.sourceStatus ?? item.source.status,
                notes: item.source.notes,
                photos: item.source.media.map((asset) => ({
                  id: asset.id,
                  storageKey: asset.storageKey,
                })),
              }
            : item.sourceStatus
              ? { status: item.sourceStatus, notes: null, photos: [] }
              : null,
        }))}
        findings={room.findings.map((finding) => ({
          id: finding.id,
          title: finding.title,
          category: finding.category,
          severity: finding.severity,
          photoCount: finding.media.length,
        }))}
        library={library}
        navigation={navigation}
        aiEnabled={isAiEnabled()}
      />
    </div>
  );
}
