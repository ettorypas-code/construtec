import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { StorageAdapter, StoredFile } from "./index";

/**
 * Armazenamento no Supabase Storage.
 *
 * Usa a *service role key*, que ignora as políticas de RLS. Isso é correto aqui
 * e só aqui: quem decide se alguém pode ver uma foto é a rota
 * `/api/arquivos/[...key]`, que exige sessão. O bucket é **privado** — nenhuma
 * foto de cliente fica acessível por URL direta.
 *
 * A service role key nunca chega ao navegador: este módulo é `server-only` e a
 * variável não tem prefixo `NEXT_PUBLIC_`.
 */

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET?.trim() || "construtec";

let client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (client) return client;

  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !key) {
    throw new Error(
      "STORAGE_DRIVER=supabase exige SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no ambiente.",
    );
  }

  client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}

export const supabaseStorageAdapter: StorageAdapter = {
  async put({ folder, fileName, mimeType, data }): Promise<StoredFile> {
    const safeFolder = sanitizeSegment(folder);
    const extension = extensionOf(fileName);
    const key = `${safeFolder}/${crypto.randomUUID()}${extension}`;

    const { error } = await getClient()
      .storage.from(BUCKET)
      .upload(key, data, { contentType: mimeType, upsert: false });

    if (error) throw new Error(`Falha ao enviar arquivo: ${error.message}`);

    return { key, fileName, mimeType, sizeBytes: data.byteLength };
  },

  async get(key) {
    const { data, error } = await getClient().storage.from(BUCKET).download(key);
    if (error || !data) return null;
    return Buffer.from(await data.arrayBuffer());
  },

  url(key) {
    // Mesma rota autenticada do modo local: o bucket é privado, então servir a
    // URL do Supabase direto exigiria link assinado — e link assinado vaza se
    // for copiado. A rota sempre revalida a sessão.
    return `/api/arquivos/${key}`;
  },

  async remove(key) {
    // Propaga a falha. Engolir aqui deixaria quem chama sem saber se o arquivo
    // saiu — e foi assim que o log de exclusão passou a contar como removido
    // arquivo que continuava no bucket. Quem decide tolerar é removeStoredFiles.
    const { error } = await getClient().storage.from(BUCKET).remove([key]);
    if (error) throw new Error(`Falha ao remover ${key}: ${error.message}`);
  },
};

function sanitizeSegment(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 40) || "misc";
}

function extensionOf(fileName: string): string {
  const index = fileName.lastIndexOf(".");
  if (index < 0) return "";
  return fileName.slice(index).toLowerCase().slice(0, 10);
}
