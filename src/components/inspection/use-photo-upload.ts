"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { compressImage } from "@/lib/utils/compress-image";

export type UploadedPhoto = {
  /** Id local, estável durante toda a vida do item na lista. */
  id: string;
  previewUrl: string;
  status: "uploading" | "done" | "error";
  /** Chave no storage. Só existe depois que o upload conclui. */
  key: string | null;
  error: string | null;
  file: File;
};

/**
 * Fila de upload de fotos.
 *
 * A foto sobe assim que é escolhida, antes de a ocorrência ser salva. Isso
 * mantém a gravação final pequena e rápida, e faz o tempo de espera acontecer
 * enquanto a pessoa ainda está digitando a descrição — em vez de tudo de uma
 * vez no "Salvar", que é quando ela quer ir para o próximo problema.
 *
 * Uma falha de upload não bloqueia nada: a foto fica marcada com erro e pode
 * ser reenviada; a ocorrência salva com as fotos que subiram.
 */
export function usePhotoUpload(folder: string) {
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  const objectUrls = useRef<string[]>([]);

  useEffect(() => {
    const urls = objectUrls.current;
    return () => {
      for (const url of urls) URL.revokeObjectURL(url);
    };
  }, []);

  const upload = useCallback(
    async (photoId: string, file: File) => {
      // Comprimir aqui, e não no `addFiles`, mantém o arquivo original guardado
      // no item: se o envio falhar, o reenvio recomprime a partir da origem.
      const { file: compressed } = await compressImage(file);

      const body = new FormData();
      body.append("file", compressed);
      body.append("folder", folder);

      try {
        const response = await fetch("/api/upload", { method: "POST", body });
        const payload: unknown = await response.json().catch(() => null);

        if (!response.ok) {
          const message =
            payload && typeof payload === "object" && "error" in payload
              ? String((payload as { error: unknown }).error)
              : "Falha no envio.";
          throw new Error(message);
        }

        const key = (payload as { key?: string })?.key;
        if (!key) throw new Error("Resposta inválida do servidor.");

        setPhotos((current) =>
          current.map((photo) =>
            photo.id === photoId ? { ...photo, status: "done", key, error: null } : photo,
          ),
        );
      } catch (error) {
        setPhotos((current) =>
          current.map((photo) =>
            photo.id === photoId
              ? {
                  ...photo,
                  status: "error",
                  error: error instanceof Error ? error.message : "Falha no envio.",
                }
              : photo,
          ),
        );
      }
    },
    [folder],
  );

  const addFiles = useCallback(
    (files: FileList | File[]) => {
      const incoming = Array.from(files);
      if (incoming.length === 0) return;

      const created = incoming.map((file) => {
        const previewUrl = URL.createObjectURL(file);
        objectUrls.current.push(previewUrl);
        return {
          id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          previewUrl,
          status: "uploading" as const,
          key: null,
          error: null,
          file,
        };
      });

      setPhotos((current) => [...current, ...created]);
      for (const photo of created) void upload(photo.id, photo.file);
    },
    [upload],
  );

  const retry = useCallback(
    (photoId: string) => {
      const target = photos.find((photo) => photo.id === photoId);
      if (!target) return;
      setPhotos((current) =>
        current.map((photo) =>
          photo.id === photoId ? { ...photo, status: "uploading", error: null } : photo,
        ),
      );
      void upload(photoId, target.file);
    },
    [photos, upload],
  );

  const remove = useCallback((photoId: string) => {
    setPhotos((current) => current.filter((photo) => photo.id !== photoId));
  }, []);

  const reset = useCallback(() => {
    setPhotos([]);
  }, []);

  return {
    photos,
    addFiles,
    retry,
    remove,
    reset,
    uploadedKeys: photos
      .filter((photo) => photo.status === "done" && photo.key)
      .map((photo) => photo.key as string),
    isUploading: photos.some((photo) => photo.status === "uploading"),
    hasErrors: photos.some((photo) => photo.status === "error"),
  };
}
