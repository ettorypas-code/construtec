import { getCurrentUser } from "@/lib/auth/guards";
import { getReport } from "@/lib/services/reports";
import { storage } from "@/lib/storage";

/** Entrega o PDF já gerado. A geração acontece na action, não aqui. */
export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return new Response("Não autenticado.", { status: 401 });

  const { id } = await context.params;
  const report = await getReport(id);

  if (!report?.storageKey) return new Response("Relatório não encontrado.", { status: 404 });

  const data = await storage.get(report.storageKey);
  if (!data) return new Response("Arquivo do relatório não encontrado.", { status: 404 });

  return new Response(new Uint8Array(data), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${report.number}.pdf"`,
      "Content-Length": String(data.byteLength),
      "Cache-Control": "private, max-age=300",
    },
  });
}
