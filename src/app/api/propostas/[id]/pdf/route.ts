import { getCurrentUser } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { renderProposalPdf } from "@/lib/services/proposal-pdf";

/**
 * PDF da proposta.
 *
 * Duas portas de entrada: quem tem sessão pede pelo id; o cliente pede pelo
 * token público que recebeu no link. Sem uma das duas, 404 — e não 403, para
 * não confirmar a existência do documento a quem chutou o id.
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const token = new URL(request.url).searchParams.get("token");

  const proposal = await db.proposal.findUnique({
    where: { id },
    select: { id: true, number: true, publicToken: true },
  });

  if (!proposal) return new Response("Proposta não encontrada.", { status: 404 });

  const hasValidToken = Boolean(token && proposal.publicToken && token === proposal.publicToken);

  if (!hasValidToken) {
    const user = await getCurrentUser();
    if (!user) return new Response("Proposta não encontrada.", { status: 404 });
  }

  const pdf = await renderProposalPdf(proposal.id);

  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${proposal.number}.pdf"`,
      "Content-Length": String(pdf.byteLength),
      "Cache-Control": "private, no-store",
    },
  });
}
