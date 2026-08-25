"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { publicFormAction } from "@/lib/actions/action";
import { decideProposal } from "@/lib/services/proposals";

/**
 * Decisão do cliente sobre a proposta.
 *
 * Ação pública, autenticada apenas pelo token do link — o cliente não tem
 * conta. O token é um UUID v4 gerado no envio; a proteção contra respostas
 * repetidas está no serviço, que recusa proposta já decidida ou expirada.
 */
export const decideProposalAction = publicFormAction({
  schema: z.object({
    token: z.string().trim().min(1),
    decision: z.enum(["aceitar", "recusar"]),
  }),
  handler: async ({ token, decision }) => {
    const proposal = await decideProposal(token, decision === "aceitar");
    revalidatePath(`/p/${token}`);
    revalidatePath("/propostas");
    revalidatePath("/dashboard");
    return { status: proposal.status };
  },
});
