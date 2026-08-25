"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Search } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Sheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { FormError } from "@/components/ui/states";
import { useToast } from "@/components/ui/toast";
import { FindingCategory, Severity, SEVERITY_ORDER } from "@/domain/enums";
import {
  findingCategoryLabels,
  severityHints,
  severityLabels,
  toOptions,
} from "@/domain/labels";
import { createFindingAction } from "@/app/(app)/vistorias/actions";
import { suggestFindingDescriptionAction } from "@/app/(app)/actions-ai";
import { SuggestButton } from "@/components/ai/suggest-button";
import { PhotoStrip } from "./photo-strip";
import { usePhotoUpload } from "./use-photo-upload";

export type LibraryEntry = {
  id: string;
  category: string;
  title: string;
  defaultDescription: string | null;
  defaultSeverity: string;
};

const categoryOptions = toOptions(findingCategoryLabels);

const severityStyles: Record<string, string> = {
  CRITICA: "border-critical/40 bg-critical-soft text-critical",
  ALTA: "border-high/40 bg-high-soft text-high",
  MEDIA: "border-medium/40 bg-medium-soft text-medium",
  BAIXA: "border-low/30 bg-low-soft text-low",
};

/**
 * Registro de ocorrência: FOTO → DESCRIÇÃO → CLASSIFICAÇÃO → SALVAR.
 *
 * Tudo em uma folha só, sem passos nem navegação. A ordem dos blocos é a ordem
 * em que a pessoa age dentro do imóvel: ela vê o problema, fotografa, escolhe
 * na biblioteca (que já preenche texto e gravidade) e salva.
 *
 * "Salvar e continuar" mantém a folha aberta com o ambiente selecionado, para
 * o próximo problema — que quase nunca é o único do cômodo.
 *
 * O estado inicial vem das props e nunca é sincronizado por efeito: quem abre a
 * folha troca a `key` do componente (ver `RoomWork`), então cada abertura é uma
 * montagem nova, já com a sugestão certa. Resetar por `useEffect` produziria
 * renderização em cascata a cada abertura.
 */
export function FindingSheet({
  open,
  onClose,
  inspectionId,
  roomId,
  roomName,
  library,
  suggestedCategory,
  suggestedTitle,
  aiEnabled = false,
}: {
  open: boolean;
  onClose: () => void;
  inspectionId: string;
  roomId: string | null;
  roomName: string | null;
  library: LibraryEntry[];
  suggestedCategory?: string | null;
  suggestedTitle?: string | null;
  /** Falso quando não há chave de IA: o botão de sugestão nem é renderizado. */
  aiEnabled?: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const photos = usePhotoUpload(`vistoria-${inspectionId}`);

  const [category, setCategory] = useState<string>(suggestedCategory ?? FindingCategory.OUTRO);
  const [title, setTitle] = useState(suggestedTitle ?? "");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<string>(Severity.MEDIA);
  const [locationNote, setLocationNote] = useState("");
  const [libraryId, setLibraryId] = useState<string | null>(null);
  const [librarySearch, setLibrarySearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  const suggestions = useMemo(() => {
    const term = librarySearch.trim().toLowerCase();
    const pool = term
      ? library.filter((entry) => entry.title.toLowerCase().includes(term))
      : library.filter((entry) => entry.category === category);
    return pool.slice(0, 8);
  }, [library, librarySearch, category]);

  function applyLibraryEntry(entry: LibraryEntry) {
    setCategory(entry.category);
    setTitle(entry.title);
    setDescription(entry.defaultDescription ?? "");
    setSeverity(entry.defaultSeverity);
    setLibraryId(entry.id);
  }

  function save(continueAfter: boolean) {
    if (title.trim() === "") {
      setError("Descreva o problema em poucas palavras.");
      return;
    }

    setError(null);

    startTransition(async () => {
      const result = await createFindingAction({
        inspectionId,
        roomId: roomId ?? "",
        category,
        title: title.trim(),
        description,
        severity,
        locationNote,
        libraryId: libraryId ?? "",
        mediaKeys: photos.uploadedKeys,
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      toast("Ocorrência registrada.");
      router.refresh();

      if (continueAfter) {
        setTitle("");
        setDescription("");
        setSeverity(Severity.MEDIA);
        setLocationNote("");
        setLibraryId(null);
        setLibrarySearch("");
        photos.reset();
      } else {
        onClose();
      }
    });
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Nova ocorrência"
      description={roomName ?? undefined}
      size="lg"
      footer={
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="lg"
            className="flex-1"
            disabled={pending}
            onClick={() => save(false)}
          >
            Salvar
          </Button>
          <Button
            size="lg"
            className="flex-[2]"
            loading={pending}
            onClick={() => save(true)}
          >
            Salvar e continuar
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        <FormError message={error} />

        {/* 1 — FOTO */}
        <PhotoStrip
          photos={photos.photos}
          onAdd={photos.addFiles}
          onRemove={photos.remove}
          onRetry={photos.retry}
        />
        {photos.isUploading ? (
          <p className="-mt-3 text-xs text-ink-500">
            Enviando fotos… você pode continuar preenchendo.
          </p>
        ) : null}

        {/* 2 — DESCRIÇÃO, com atalho pela biblioteca */}
        <div className="space-y-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-400" />
            <Input
              value={librarySearch}
              onChange={(event) => setLibrarySearch(event.target.value)}
              placeholder="Buscar problema na biblioteca"
              className="pl-9"
            />
          </div>

          {suggestions.length > 0 ? (
            <ul className="flex flex-wrap gap-1.5">
              {suggestions.map((entry) => (
                <li key={entry.id}>
                  <button
                    type="button"
                    onClick={() => applyLibraryEntry(entry)}
                    className={cn(
                      "rounded-full border px-2.5 py-1 text-xs transition-colors",
                      libraryId === entry.id
                        ? "border-brand-300 bg-brand-50 text-brand-700"
                        : "border-ink-200 bg-surface text-ink-600 hover:bg-ink-50",
                    )}
                  >
                    {entry.title}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-ink-400">
              Nenhum problema salvo para esta categoria. Escreva livremente abaixo.
            </p>
          )}
        </div>

        <Field label="Problema" htmlFor="finding-title" required>
          <Input
            id="finding-title"
            value={title}
            onChange={(event) => {
              setTitle(event.target.value);
              setLibraryId(null);
            }}
            placeholder="Ex.: Rejunte falho no box"
          />
        </Field>

        <Field label="Descrição" htmlFor="finding-description">
          <Textarea
            id="finding-description"
            rows={3}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Detalhe o que foi observado, sem afirmar causa."
          />
        </Field>

        {aiEnabled ? (
          <SuggestButton
            label="Sugerir descrição técnica"
            request={() =>
              suggestFindingDescriptionAction({
                title,
                roomName: roomName ?? "",
                category,
                severity,
                notes: description,
              })
            }
            onApply={setDescription}
          />
        ) : null}

        {/* 3 — CLASSIFICAÇÃO */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-ink-700">Gravidade</p>
          <div className="grid grid-cols-2 gap-2">
            {SEVERITY_ORDER.map((level) => {
              const selected = severity === level;
              return (
                <button
                  key={level}
                  type="button"
                  onClick={() => setSeverity(level)}
                  className={cn(
                    "flex h-touch-lg flex-col items-start justify-center rounded-control border px-3 text-left transition-all",
                    selected
                      ? `${severityStyles[level]} ring-2 ring-current/20`
                      : "border-ink-200 bg-surface text-ink-600 hover:bg-ink-50",
                  )}
                >
                  <span className="flex items-center gap-1.5 text-sm font-medium">
                    {selected ? <Check className="size-3.5" /> : null}
                    {severityLabels[level]}
                  </span>
                  <span className="mt-0.5 line-clamp-1 text-[0.6875rem] opacity-75">
                    {severityHints[level]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Categoria" htmlFor="finding-category">
            <Select
              id="finding-category"
              options={categoryOptions}
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            />
          </Field>

          <Field label="Local exato" htmlFor="finding-location" hint="Opcional.">
            <Input
              id="finding-location"
              value={locationNote}
              onChange={(event) => setLocationNote(event.target.value)}
              placeholder="Parede à direita da porta"
            />
          </Field>
        </div>
      </div>
    </Sheet>
  );
}
