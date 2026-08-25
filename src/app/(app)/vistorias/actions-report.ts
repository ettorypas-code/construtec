"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { objectAction } from "@/lib/actions/action";
import { requiredId } from "@/lib/validation/common";
import { generateInspectionReport, markReportSent } from "@/lib/services/reports";

/**
 * Ações de documento ficam separadas de `actions.ts` porque puxam a cadeia de
 * dependências do gerador de PDF. Manter isso fora do módulo que a tela de
 * vistoria importa evita arrastar o renderizador para bundles onde ele não é
 * usado.
 */

export const generateReportAction = objectAction({
  schema: z.object({ inspectionId: requiredId }),
  handler: async ({ inspectionId }, { user }) => {
    const report = await generateInspectionReport(inspectionId, user.id);
    revalidatePath(`/vistorias/${inspectionId}`);
    revalidatePath(`/vistorias/${inspectionId}/relatorio`);
    revalidatePath("/dashboard");
    return { reportId: report.id, number: report.number };
  },
});

export const markReportSentAction = objectAction({
  schema: z.object({ reportId: requiredId, inspectionId: requiredId }),
  handler: async ({ reportId, inspectionId }, { user }) => {
    await markReportSent(reportId, user.id);
    revalidatePath(`/vistorias/${inspectionId}/relatorio`);
    return { reportId };
  },
});
