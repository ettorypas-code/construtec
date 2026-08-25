"use server";

import { revalidatePath } from "next/cache";
import { publicFormAction } from "@/lib/actions/action";
import { publicLeadSchema } from "@/lib/validation/crm";
import { createPublicLead } from "@/lib/services/leads";

/**
 * Captação de lead pelo site.
 *
 * Ação pública: sem sessão, com consentimento LGPD obrigatório no schema. O
 * `origin` guarda de qual landing veio, que é o dado que responde "qual página
 * está trazendo cliente".
 */
export const submitPublicLeadAction = publicFormAction({
  schema: publicLeadSchema,
  successMessage: "Recebemos seu pedido.",
  handler: async ({ name, phone, email, serviceCode, message, origin }) => {
    await createPublicLead({ name, phone, email, serviceCode, message, origin });
    revalidatePath("/crm");
    revalidatePath("/dashboard");
    return { received: true };
  },
});
