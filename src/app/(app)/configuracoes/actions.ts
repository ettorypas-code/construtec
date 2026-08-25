"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { formAction } from "@/lib/actions/action";
import { companySettingsSchema } from "@/lib/validation/settings";
import { logActivity } from "@/lib/services/activity";
import { CouncilType } from "@/domain/enums";

export const updateCompanySettingsAction = formAction({
  schema: companySettingsSchema,
  successMessage: "Configurações salvas.",
  handler: async (input, { user }) => {
    // Marcar "posso emitir ART/RRT" sem registro em conselho seria uma
    // afirmação falsa gravada no banco — e ela chegaria aos documentos.
    const canIssueArt = input.councilType === CouncilType.NENHUM ? false : input.canIssueArt;

    await db.companySettings.upsert({
      where: { id: "default" },
      update: { ...input, canIssueArt },
      create: { id: "default", ...input, canIssueArt },
    });

    await logActivity({
      userId: user.id,
      action: "settings.updated",
      summary: "Configurações da empresa atualizadas",
    });

    // Título e aviso legal dos documentos derivam daqui: tudo que os exibe
    // precisa ser revalidado.
    revalidatePath("/configuracoes");
    revalidatePath("/vistorias");
    revalidatePath("/propostas");
    revalidatePath("/", "layout");

    return { ok: true };
  },
});
