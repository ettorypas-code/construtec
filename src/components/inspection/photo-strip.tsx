"use client";

import { useRef } from "react";
import { Camera, ImagePlus, RotateCw, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Spinner } from "@/components/ui/spinner";
import type { UploadedPhoto } from "./use-photo-upload";

/**
 * Faixa de fotos com dois pontos de entrada: câmera nativa e galeria.
 *
 * `capture="environment"` abre a câmera traseira direto no celular, sem passar
 * pelo seletor de arquivos — é o primeiro toque do fluxo de ocorrência e
 * precisa levar zero decisões.
 */
export function PhotoStrip({
  photos,
  onAdd,
  onRemove,
  onRetry,
}: {
  photos: UploadedPhoto[];
  onAdd: (files: FileList) => void;
  onRemove: (id: string) => void;
  onRetry: (id: string) => void;
}) {
  const cameraInput = useRef<HTMLInputElement>(null);
  const galleryInput = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => cameraInput.current?.click()}
          className="flex h-touch-lg flex-1 items-center justify-center gap-2 rounded-control bg-brand-600 text-sm font-medium text-white transition-colors hover:bg-brand-700 active:bg-brand-800"
        >
          <Camera className="size-5" />
          Tirar foto
        </button>
        <button
          type="button"
          onClick={() => galleryInput.current?.click()}
          aria-label="Escolher da galeria"
          className="flex h-touch-lg w-14 items-center justify-center rounded-control border border-ink-200 bg-surface text-ink-600 transition-colors hover:bg-ink-50"
        >
          <ImagePlus className="size-5" />
        </button>
      </div>

      <input
        ref={cameraInput}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        className="hidden"
        onChange={(event) => {
          if (event.target.files?.length) onAdd(event.target.files);
          event.target.value = "";
        }}
      />
      <input
        ref={galleryInput}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(event) => {
          if (event.target.files?.length) onAdd(event.target.files);
          event.target.value = "";
        }}
      />

      {photos.length > 0 ? (
        <ul className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {photos.map((photo) => (
            <li key={photo.id} className="relative shrink-0">
              {/* Preview local: é um object URL, não passa pelo otimizador. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.previewUrl}
                alt=""
                className={cn(
                  "size-20 rounded-control border border-ink-200 object-cover",
                  photo.status !== "done" && "opacity-60",
                )}
              />

              {photo.status === "uploading" ? (
                <span className="absolute inset-0 flex items-center justify-center rounded-control bg-ink-900/25">
                  <Spinner className="size-5 text-white" />
                </span>
              ) : null}

              {photo.status === "error" ? (
                <button
                  type="button"
                  onClick={() => onRetry(photo.id)}
                  title={photo.error ?? "Tentar novamente"}
                  className="absolute inset-0 flex flex-col items-center justify-center gap-1 rounded-control bg-danger/80 text-[0.625rem] font-medium text-white"
                >
                  <RotateCw className="size-4" />
                  Reenviar
                </button>
              ) : null}

              <button
                type="button"
                onClick={() => onRemove(photo.id)}
                aria-label="Remover foto"
                className="absolute -right-1.5 -top-1.5 flex size-6 items-center justify-center rounded-full border border-ink-200 bg-surface text-ink-500 shadow-subtle transition-colors hover:text-danger"
              >
                <X className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
