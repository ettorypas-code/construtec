import { getCurrentUser } from "@/lib/auth/guards";
import { storage } from "@/lib/storage";

/**
 * Entrega um arquivo do storage — apenas para quem tem sessão.
 *
 * As fotos de vistoria são dados de cliente. Servir de `public/` deixaria
 * qualquer pessoa com a URL ver o interior do imóvel de um cliente.
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ key: string[] }> },
) {
  const user = await getCurrentUser();
  if (!user) return new Response("Não autenticado.", { status: 401 });

  const { key } = await context.params;
  const storageKey = key.join("/");

  const data = await storage.get(storageKey);
  if (!data) return new Response("Arquivo não encontrado.", { status: 404 });

  return new Response(new Uint8Array(data), {
    headers: {
      "Content-Type": guessMimeType(storageKey),
      "Cache-Control": "private, max-age=3600",
      "Content-Length": String(data.byteLength),
    },
  });
}

function guessMimeType(key: string): string {
  const extension = key.slice(key.lastIndexOf(".")).toLowerCase();
  switch (extension) {
    case ".png":
      return "image/png";
    case ".webp":
      return "image/webp";
    case ".heic":
      return "image/heic";
    case ".pdf":
      return "application/pdf";
    default:
      return "image/jpeg";
  }
}
