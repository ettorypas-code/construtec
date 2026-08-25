"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { objectAction } from "@/lib/actions/action";
import { requiredId } from "@/lib/validation/common";
import { setAutomationEnabled } from "@/lib/services/automations";

export const toggleAutomationAction = objectAction({
  schema: z.object({ id: requiredId, enabled: z.boolean() }),
  handler: async ({ id, enabled }, { user }) => {
    await setAutomationEnabled(id, enabled, user.id);
    revalidatePath("/configuracoes");
    return { id, enabled };
  },
});
