import "server-only";

import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { StorageAdapter, StoredFile } from "./index";

/**
 * Armazenamento em disco, para desenvolvimento.
 *
 * Os arquivos ficam em `./storage`, fora de `public/`, e são servidos pela rota
 * `/api/arquivos/[...key]`, que verifica a sessão. Deixar em `public/` tornaria
 * toda foto de vistoria de todo cliente publicamente acessível por URL.
 */

const ROOT = path.join(process.cwd(), "storage");

export const localStorageAdapter: StorageAdapter = {
  async put({ folder, fileName, mimeType, data }): Promise<StoredFile> {
    const safeFolder = sanitizeSegment(folder);
    const extension = path.extname(fileName).toLowerCase().slice(0, 10);
    const key = `${safeFolder}/${randomUUID()}${extension}`;

    const absolutePath = path.join(ROOT, key);
    await mkdir(path.dirname(absolutePath), { recursive: true });
    await writeFile(absolutePath, data);

    return { key, fileName, mimeType, sizeBytes: data.byteLength };
  },

  async get(key) {
    const absolutePath = resolveKey(key);
    if (!absolutePath) return null;
    try {
      return await readFile(absolutePath);
    } catch {
      return null;
    }
  },

  url(key) {
    return `/api/arquivos/${key}`;
  },

  async remove(key) {
    const absolutePath = resolveKey(key);
    if (!absolutePath) return;
    try {
      await unlink(absolutePath);
    } catch {
      // Arquivo já removido: nada a fazer.
    }
  },
};

function sanitizeSegment(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 40) || "misc";
}

/**
 * Converte a chave em caminho absoluto, recusando qualquer coisa que escape de
 * `./storage`. Sem isso, uma chave com `../` leria arquivos do servidor.
 */
function resolveKey(key: string): string | null {
  const absolutePath = path.resolve(ROOT, key);
  const rootWithSep = ROOT.endsWith(path.sep) ? ROOT : ROOT + path.sep;
  return absolutePath.startsWith(rootWithSep) ? absolutePath : null;
}
