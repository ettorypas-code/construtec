import "server-only";

import { localStorageAdapter } from "./local";
import { supabaseStorageAdapter } from "./supabase";

/**
 * Camada de armazenamento de arquivos.
 *
 * Uma interface, dois destinos: disco local em desenvolvimento e um serviço
 * compatível com S3 em produção. O resto da aplicação só conhece `storageKey` —
 * nunca um caminho de disco nem uma URL de bucket.
 */
export type StoredFile = {
  key: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
};

export interface StorageAdapter {
  /** Grava o arquivo e devolve a chave usada para recuperá-lo depois. */
  put(input: {
    folder: string;
    fileName: string;
    mimeType: string;
    data: Buffer;
  }): Promise<StoredFile>;

  /** Bytes do arquivo. Usado na geração de PDF, que embute as fotos. */
  get(key: string): Promise<Buffer | null>;

  /** URL para exibir o arquivo no navegador. */
  url(key: string): string;

  remove(key: string): Promise<void>;
}

function resolveAdapter(): StorageAdapter {
  const driver = process.env.STORAGE_DRIVER?.trim() || "local";

  switch (driver) {
    case "local":
      return localStorageAdapter;
    case "supabase":
      return supabaseStorageAdapter;
    default:
      throw new Error(
        `STORAGE_DRIVER desconhecido: "${driver}". Use "local" ou "supabase".`,
      );
  }
}

export const storage: StorageAdapter = resolveAdapter();

/** Tipos aceitos no upload. Lista de permissão, não de bloqueio. */
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic"];
export const ALLOWED_DOCUMENT_TYPES = ["application/pdf"];
export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024; // 15 MB

export function isAllowedUpload(mimeType: string): boolean {
  return [...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOCUMENT_TYPES].includes(mimeType);
}
