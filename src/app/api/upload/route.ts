import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/guards";
import { isAllowedUpload, MAX_UPLOAD_BYTES, storage } from "@/lib/storage";

/**
 * Upload de arquivo.
 *
 * É Route Handler e não server action de propósito: server actions têm limite
 * de corpo de 1 MB por padrão, e foto de celular passa disso com folga.
 *
 * Devolve apenas a chave de armazenamento. Quem vincula o arquivo à ocorrência
 * é a action de criar/editar a ocorrência, que valida a posse do registro.
 */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Envio inválido." }, { status: 400 });
  }

  const file = formData.get("file");
  const folder = String(formData.get("folder") ?? "uploads");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Nenhum arquivo enviado." }, { status: 400 });
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json(
      { error: `Arquivo muito grande. Limite de ${Math.floor(MAX_UPLOAD_BYTES / 1024 / 1024)} MB.` },
      { status: 413 },
    );
  }

  if (!isAllowedUpload(file.type)) {
    return NextResponse.json(
      { error: "Formato não aceito. Envie imagem JPG, PNG, WEBP ou um PDF." },
      { status: 415 },
    );
  }

  try {
    const stored = await storage.put({
      folder,
      fileName: file.name || "arquivo",
      mimeType: file.type,
      data: Buffer.from(await file.arrayBuffer()),
    });

    return NextResponse.json({
      key: stored.key,
      fileName: stored.fileName,
      mimeType: stored.mimeType,
      sizeBytes: stored.sizeBytes,
      url: storage.url(stored.key),
    });
  } catch (error) {
    console.error("[upload]", error);
    return NextResponse.json({ error: "Falha ao salvar o arquivo." }, { status: 500 });
  }
}
