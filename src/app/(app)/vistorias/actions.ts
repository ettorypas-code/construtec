"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { formAction, objectAction } from "@/lib/actions/action";
import { requiredId } from "@/lib/validation/common";
import {
  checklistItemNotesSchema,
  checklistItemSchema,
  itemPhotosSchema,
  newChecklistItemSchema,
  removeChecklistItemSchema,
  findingSchema,
  findingStatusSchema,
  findingUpdateSchema,
  finishInspectionSchema,
  inspectionSchema,
  roomSchema,
} from "@/lib/validation/inspection";
import {
  addChecklistItem,
  addRoom,
  attachItemPhotos,
  createFinding,
  deleteChecklistItem,
  deleteInspection,
  setChecklistItemNotes,
  createInspection,
  deleteFinding,
  finishInspection,
  markRoomConforming,
  removeMedia,
  setChecklistItemStatus,
  setFindingStatus,
  startInspection,
  updateFinding,
} from "@/lib/services/inspections";

export const createInspectionAction = formAction({
  schema: inspectionSchema,
  handler: async (input, { user }) => {
    const inspection = await createInspection(input, user.id);
    revalidatePath("/vistorias");
    revalidatePath("/agenda");
    revalidatePath("/dashboard");
    redirect(`/vistorias/${inspection.id}`);
  },
});

export const startInspectionAction = objectAction({
  schema: z.object({ id: requiredId }),
  handler: async ({ id }, { user }) => {
    await startInspection(id, user.id);
    revalidatePath(`/vistorias/${id}`);
    return { id };
  },
});

export const finishInspectionAction = formAction({
  schema: finishInspectionSchema,
  successMessage: "Vistoria concluída.",
  handler: async ({ id, summaryText }, { user }) => {
    await finishInspection(id, summaryText, user.id);
    revalidatePath("/vistorias");
    revalidatePath(`/vistorias/${id}`);
    revalidatePath("/dashboard");
    return { id };
  },
});

export const setChecklistItemAction = objectAction({
  schema: checklistItemSchema,
  handler: async ({ itemId, inspectionId, roomId, status }) => {
    await setChecklistItemStatus(itemId, status);
    // Revalidar aqui devolve o RSC novo na mesma resposta da action, então a
    // marcação otimista é confirmada em vez de reverter.
    revalidatePath(`/vistorias/${inspectionId}/ambiente/${roomId}`);
    revalidatePath(`/vistorias/${inspectionId}`);
    return { itemId, status };
  },
});


/**
 * Revalidação do par ambiente/vistoria.
 *
 * Toda alteração de item precisa devolver o RSC novo na mesma resposta da
 * action, senão a atualização otimista da tela reverte quando a transição
 * termina.
 */
function revalidateRoom(inspectionId: string, roomId: string) {
  revalidatePath(`/vistorias/${inspectionId}/ambiente/${roomId}`);
  revalidatePath(`/vistorias/${inspectionId}`);
}

export const setChecklistNotesAction = objectAction({
  schema: checklistItemNotesSchema,
  handler: async ({ itemId, inspectionId, roomId, notes }) => {
    await setChecklistItemNotes(itemId, notes);
    revalidateRoom(inspectionId, roomId);
    return { itemId };
  },
});

export const addChecklistItemAction = formAction({
  schema: newChecklistItemSchema,
  successMessage: "Item adicionado.",
  handler: async ({ inspectionId, roomId, label, category }) => {
    const item = await addChecklistItem(roomId, { label, category });
    revalidateRoom(inspectionId, roomId);
    return { id: item.id };
  },
});

export const removeChecklistItemAction = objectAction({
  schema: removeChecklistItemSchema,
  handler: async ({ itemId, inspectionId, roomId }) => {
    await deleteChecklistItem(itemId);
    revalidateRoom(inspectionId, roomId);
    return { itemId };
  },
});

export const attachItemPhotosAction = objectAction({
  schema: itemPhotosSchema,
  handler: async ({ itemId, inspectionId, roomId, keys }) => {
    await attachItemPhotos(itemId, keys);
    revalidateRoom(inspectionId, roomId);
    return { itemId, count: keys.length };
  },
});

export const markRoomConformingAction = objectAction({
  schema: z.object({ roomId: requiredId, inspectionId: requiredId }),
  handler: async ({ roomId, inspectionId }) => {
    const count = await markRoomConforming(roomId);
    revalidatePath(`/vistorias/${inspectionId}/ambiente/${roomId}`);
    revalidatePath(`/vistorias/${inspectionId}`);
    return { count };
  },
});

export const addRoomAction = formAction({
  schema: roomSchema,
  successMessage: "Ambiente adicionado.",
  handler: async ({ inspectionId, name }) => {
    const room = await addRoom(inspectionId, name);
    revalidatePath(`/vistorias/${inspectionId}`);
    return { id: room.id };
  },
});

export const createFindingAction = objectAction({
  schema: findingSchema,
  successMessage: "Ocorrência registrada.",
  handler: async (input, { user }) => {
    const finding = await createFinding(input, user.id);
    revalidatePath(`/vistorias/${input.inspectionId}`);
    if (input.roomId) {
      revalidatePath(`/vistorias/${input.inspectionId}/ambiente/${input.roomId}`);
    }
    return { id: finding.id };
  },
});

export const updateFindingAction = formAction({
  schema: findingUpdateSchema,
  successMessage: "Ocorrência atualizada.",
  handler: async ({ id, ...input }) => {
    const finding = await updateFinding(id, input);
    if (finding.inspectionId) {
      revalidatePath(`/vistorias/${finding.inspectionId}`);
      if (finding.roomId) {
        revalidatePath(`/vistorias/${finding.inspectionId}/ambiente/${finding.roomId}`);
      }
    }
    return { id };
  },
});

export const setFindingStatusAction = objectAction({
  schema: findingStatusSchema,
  handler: async ({ id, status }) => {
    const finding = await setFindingStatus(id, status);
    if (finding.inspectionId) revalidatePath(`/vistorias/${finding.inspectionId}`);
    return { id, status };
  },
});

export const deleteFindingAction = objectAction({
  schema: z.object({ id: requiredId, inspectionId: requiredId, roomId: z.string().optional() }),
  handler: async ({ id, inspectionId, roomId }) => {
    await deleteFinding(id);
    revalidatePath(`/vistorias/${inspectionId}`);
    if (roomId) revalidatePath(`/vistorias/${inspectionId}/ambiente/${roomId}`);
    return { id };
  },
});

export const removeMediaAction = objectAction({
  schema: z.object({ id: requiredId, inspectionId: requiredId }),
  handler: async ({ id, inspectionId }) => {
    await removeMedia(id);
    revalidatePath(`/vistorias/${inspectionId}`);
    return { id };
  },
});

/**
 * Excluir vistoria.
 *
 * Não redireciona aqui: a tela que chamou é a própria vistoria, e um redirect
 * de dentro da ação corre contra o revalidate. Quem chama recebe o código e
 * navega — a confirmação some junto com a página.
 */
export const deleteInspectionAction = objectAction({
  schema: z.object({ id: requiredId }),
  handler: async ({ id }, { user }) => {
    const { code } = await deleteInspection(id, user.id);
    revalidatePath("/vistorias");
    revalidatePath("/agenda");
    revalidatePath("/dashboard");
    return { code };
  },
});
