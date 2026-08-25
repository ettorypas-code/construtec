/**
 * Compressão de imagem no navegador, antes do upload.
 *
 * Roda só no cliente (usa canvas). Três problemas resolvidos de uma vez:
 *
 *  1. **Dado móvel.** Uma vistoria tem 40 a 80 fotos. A 3 MB cada, são 240 MB
 *     subindo pelo 4G de dentro de um prédio, que é justamente onde o sinal é
 *     pior. A 250 KB, o upload acompanha a digitação.
 *  2. **Custo de armazenamento.** No plano gratuito de 1 GB, foto original dá
 *     para umas quatro vistorias. Comprimida, passa de cinquenta.
 *  3. **Peso do PDF.** Relatório com 60 fotos originais passa de 100 MB e o
 *     cliente não consegue abrir no celular nem receber por e-mail.
 *
 * 1600px no lado maior é folgado para o que o relatório usa: as fotos aparecem
 * em 152pt de largura no PDF (~200px impressos a 96dpi). A perda é invisível no
 * documento entregue.
 */

const MAX_EDGE = 1600;
const JPEG_QUALITY = 0.82;

/** Abaixo disso não vale o custo de recodificar. */
const SKIP_BELOW_BYTES = 300 * 1024;

export type CompressionResult = {
  file: File;
  originalBytes: number;
  compressedBytes: number;
};

export async function compressImage(file: File): Promise<CompressionResult> {
  const unchanged: CompressionResult = {
    file,
    originalBytes: file.size,
    compressedBytes: file.size,
  };

  // HEIC do iPhone não é decodificável por canvas em todos os navegadores, e
  // PNG costuma ser captura de tela (recodificar para JPEG degradaria texto).
  if (!file.type.startsWith("image/") || file.type === "image/heic") return unchanged;
  if (file.size <= SKIP_BELOW_BYTES) return unchanged;

  try {
    const bitmap = await createImageBitmap(file);

    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    if (!context) return unchanged;

    context.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY);
    });

    // Se a compressão não ganhou nada (foto já pequena ou muito ruidosa),
    // mandar o original evita perder qualidade à toa.
    if (!blob || blob.size >= file.size) return unchanged;

    const name = file.name.replace(/\.[^.]+$/, "") || "foto";
    return {
      file: new File([blob], `${name}.jpg`, { type: "image/jpeg", lastModified: Date.now() }),
      originalBytes: file.size,
      compressedBytes: blob.size,
    };
  } catch {
    // Formato que o navegador não decodifica: sobe o original e deixa o
    // servidor decidir se aceita.
    return unchanged;
  }
}

/** Comprime uma lista, preservando a ordem. */
export async function compressImages(files: File[]): Promise<File[]> {
  const results = await Promise.all(files.map((file) => compressImage(file)));
  return results.map((result) => result.file);
}
