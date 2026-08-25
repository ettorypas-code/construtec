"use client";

import { useOptimistic, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Camera, Loader2, Trash2, TriangleAlert, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { compressImage } from "@/lib/utils/compress-image";
import { useToast } from "@/components/ui/toast";
import {
  ChecklistItemStatus,
  isProblemStatus,
  RATING_SCALE_VALUES,
  type RatingScale,
} from "@/domain/enums";
import { checklistItemStatusLabels, checklistItemStatusShort } from "@/domain/labels";
import {
  attachItemPhotosAction,
  removeChecklistItemAction,
  removeMediaAction,
  setChecklistItemAction,
} from "@/app/(app)/vistorias/actions";

export type ChecklistItemView = {
  id: string;
  label: string;
  category: string | null;
  status: string;
  custom: boolean;
  photos: Array<{ id: string; storageKey: string }>;
  /** Só em revistoria: como o item estava e o que foi fotografado antes. */
  before?: {
    status: string;
    notes: string | null;
    photos: Array<{ id: string; storageKey: string }>;
  } | null;
};

/** Cor de cada avaliação quando selecionada. Reprova o cinza genérico. */
const statusStyles: Record<string, string> = {
  OK: "border-success bg-success-soft text-success",
  NAO_CONFORME: "border-danger bg-danger-soft text-danger",
  NOVO: "border-success bg-success-soft text-success",
  BOM: "border-brand-500 bg-brand-50 text-brand-700",
  REGULAR: "border-medium bg-medium-soft text-medium",
  RUIM: "border-high bg-high-soft text-high",
  PESSIMO: "border-critical bg-critical-soft text-critical",
  CORRIGIDO: "border-success bg-success-soft text-success",
  CORRIGIDO_PARCIAL: "border-medium bg-medium-soft text-medium",
  NAO_CORRIGIDO: "border-critical bg-critical-soft text-critical",
  NAO_APLICAVEL: "border-ink-300 bg-ink-100 text-ink-500",
};

/**
 * Linha do checklist.
 *
 * Estrutura em duas faixas porque a escala de estado tem seis botões, e seis
 * botões com rótulo legível não cabem ao lado do nome do item em tela de 375px:
 *
 *   Piso                                    [📷 2]  [🗑]
 *   [ Novo ][ Bom ][ Reg. ][ Ruim ][ Péss. ][ N/A ]
 *
 * A câmera é um toque só: abre a câmera nativa, sobe a foto e anexa ao item.
 * Fotografar item conforme é tão importante quanto fotografar defeito — é o
 * que prova depois em que estado o imóvel foi recebido.
 */
export function ChecklistRow({
  item,
  inspectionId,
  roomId,
  ratingScale,
  onReportProblem,
}: {
  item: ChecklistItemView;
  inspectionId: string;
  roomId: string;
  ratingScale: RatingScale;
  onReportProblem: () => void;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [, startTransition] = useTransition();
  const [status, setStatus] = useOptimistic(item.status);
  const [uploading, setUploading] = useState(0);
  const cameraInput = useRef<HTMLInputElement>(null);

  const options = RATING_SCALE_VALUES[ratingScale];

  function choose(next: string) {
    startTransition(async () => {
      setStatus(next);
      const result = await setChecklistItemAction({
        itemId: item.id,
        inspectionId,
        roomId,
        status: next,
      });
      if (!result.ok) toast(result.error, "error");
    });
  }

  async function uploadPhotos(files: FileList) {
    const list = Array.from(files);
    setUploading(list.length);

    const keys: string[] = [];
    for (const file of list) {
      const { file: compressed } = await compressImage(file);

      const body = new FormData();
      body.append("file", compressed);
      body.append("folder", `vistoria-${inspectionId}`);
      try {
        const response = await fetch("/api/upload", { method: "POST", body });
        const payload = (await response.json()) as { key?: string; error?: string };
        if (!response.ok || !payload.key) throw new Error(payload.error ?? "Falha no envio.");
        keys.push(payload.key);
      } catch (error) {
        toast(error instanceof Error ? error.message : "Falha ao enviar a foto.", "error");
      }
    }

    setUploading(0);
    if (keys.length === 0) return;

    startTransition(async () => {
      const result = await attachItemPhotosAction({
        itemId: item.id,
        inspectionId,
        roomId,
        keys,
      });
      if (result.ok) router.refresh();
      else toast(result.error, "error");
    });
  }

  return (
    <li className="px-3 py-2.5">
      {/* Numa revistoria, o "antes" vem antes: quem está de pé no imóvel
          precisa ver o que foi apontado para saber o que conferir. Sem isso a
          linha vira um rótulo solto e a conferência vira chute. */}
      {item.before ? (
        <div className="mb-2 flex items-start gap-2 rounded-control border border-ink-200 bg-ink-50 px-2.5 py-2">
          <div className="min-w-0 flex-1">
            <p className="text-[0.6875rem] font-semibold uppercase tracking-wide text-ink-500">
              Estava assim
            </p>
            <p className="mt-0.5 text-sm font-medium text-ink-800">
              {checklistItemStatusLabels[
                item.before.status as keyof typeof checklistItemStatusLabels
              ] ?? item.before.status}
            </p>
            {item.before.notes ? (
              <p className="mt-0.5 text-xs leading-relaxed text-ink-600">{item.before.notes}</p>
            ) : null}
          </div>

          {item.before.photos.length > 0 ? (
            <ul className="flex shrink-0 gap-1">
              {item.before.photos.map((photo) => (
                <li key={photo.id}>
                  <a
                    href={`/api/arquivos/${photo.storageKey}`}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`Ver foto anterior de ${item.label}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`/api/arquivos/${photo.storageKey}`}
                      alt={`${item.label} antes`}
                      className="size-12 rounded border border-ink-200 object-cover"
                    />
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      <div className="flex items-start gap-2">
        <span className="min-w-0 flex-1 pt-2 text-sm text-ink-800">
          {item.label}
          {item.custom ? (
            <span className="ml-1.5 text-xs text-ink-400">(incluído)</span>
          ) : null}
        </span>

        {isProblemStatus(status) ? (
          <button
            type="button"
            onClick={onReportProblem}
            aria-label={`Registrar ocorrência em ${item.label}`}
            className="flex size-11 shrink-0 items-center justify-center rounded-control text-high transition-colors hover:bg-high-soft"
          >
            <TriangleAlert className="size-4" />
          </button>
        ) : null}

        <button
          type="button"
          onClick={() => cameraInput.current?.click()}
          aria-label={`Fotografar ${item.label}`}
          className={cn(
            "relative flex size-11 shrink-0 items-center justify-center rounded-control transition-colors",
            item.photos.length > 0
              ? "text-brand-600 hover:bg-brand-50"
              : "text-ink-400 hover:bg-ink-100",
          )}
        >
          {uploading > 0 ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Camera className="size-4" />
          )}
          {item.photos.length > 0 ? (
            <span className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-brand-600 text-[0.5625rem] font-semibold text-white">
              {item.photos.length}
            </span>
          ) : null}
        </button>

        {/* Vale para qualquer item, não só os incluídos: o modelo é um ponto
            de partida, e o imóvel real manda. Apartamento de um dormitório não
            tem "Quarto 2", e deixar o item pendente sujaria o relatório. */}
        <RemoveItemButton
          itemId={item.id}
          label={item.label}
          inspectionId={inspectionId}
          roomId={roomId}
          temFotos={item.photos.length > 0}
        />
      </div>

      <input
        ref={cameraInput}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        className="hidden"
        onChange={(event) => {
          if (event.target.files?.length) void uploadPhotos(event.target.files);
          event.target.value = "";
        }}
      />

      {item.photos.length > 0 ? (
        <ul className="mt-1.5 flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {item.photos.map((photo) => (
            <li key={photo.id} className="relative shrink-0">
              {/* Rota autenticada, fora do otimizador do next/image. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/arquivos/${photo.storageKey}`}
                alt={`${item.label} — registro fotográfico`}
                className="size-14 rounded-control border border-ink-200 object-cover"
              />
              <button
                type="button"
                aria-label="Remover foto"
                onClick={() =>
                  startTransition(async () => {
                    const result = await removeMediaAction({ id: photo.id, inspectionId });
                    if (result.ok) router.refresh();
                    else toast(result.error, "error");
                  })
                }
                className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full border border-ink-200 bg-surface text-ink-500 shadow-subtle transition-colors hover:text-danger"
              >
                <X className="size-3" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <div
        className="mt-1.5 grid gap-1"
        style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
      >
        {options.map((option) => {
          const selected = status === option;
          return (
            <button
              key={option}
              type="button"
              onClick={() => choose(selected ? ChecklistItemStatus.PENDENTE : option)}
              aria-pressed={selected}
              aria-label={checklistItemStatusLabels[option]}
              title={checklistItemStatusLabels[option]}
              className={cn(
                "h-11 rounded-control border text-[0.6875rem] font-semibold transition-colors",
                selected
                  ? statusStyles[option]
                  : "border-ink-200 bg-surface text-ink-400 hover:bg-ink-50",
              )}
            >
              {checklistItemStatusShort[option]}
            </button>
          );
        })}
      </div>
    </li>
  );
}

function RemoveItemButton({
  itemId,
  label,
  inspectionId,
  roomId,
  temFotos,
}: {
  itemId: string;
  label: string;
  inspectionId: string;
  roomId: string;
  temFotos: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [confirmando, setConfirmando] = useState(false);

  function remover() {
    startTransition(async () => {
      const result = await removeChecklistItemAction({ itemId, inspectionId, roomId });
      if (result.ok) {
        toast("Item removido.");
        router.refresh();
      } else {
        toast(result.error, "error");
        setConfirmando(false);
      }
    });
  }

  // Item com foto pede confirmação: remover leva as fotos junto, e refazer
  // significa voltar ao imóvel.
  if (confirmando) {
    return (
      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          disabled={pending}
          onClick={remover}
          className="h-11 rounded-control bg-danger px-2.5 text-xs font-semibold text-white disabled:opacity-50"
        >
          Apagar
        </button>
        <button
          type="button"
          onClick={() => setConfirmando(false)}
          aria-label="Cancelar remoção"
          className="flex size-11 items-center justify-center rounded-control text-ink-400 hover:bg-ink-100"
        >
          <X className="size-4" />
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      disabled={pending}
      aria-label={`Remover ${label}`}
      onClick={() => (temFotos ? setConfirmando(true) : remover())}
      className="flex size-11 shrink-0 items-center justify-center rounded-control text-ink-300 transition-colors hover:bg-danger-soft hover:text-danger disabled:opacity-50"
    >
      <Trash2 className="size-4" />
    </button>
  );
}
