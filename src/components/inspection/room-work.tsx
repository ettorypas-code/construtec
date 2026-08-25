"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { ChevronRight, CircleSlash, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { Field, Input, Select } from "@/components/ui/form";
import { FormError } from "@/components/ui/states";
import { SubmitButton } from "@/components/ui/submit-button";
import { useToast } from "@/components/ui/toast";
import {
  ChecklistItemStatus,
  RATING_SCALE_VALUES,
  type RatingScale,
  type Severity,
} from "@/domain/enums";
import {
  checklistItemStatusLabels,
  checklistItemStatusShort,
  findingCategoryLabels,
  severityLabels,
  severityTones,
  toOptions,
} from "@/domain/labels";
import type { ActionResult } from "@/lib/actions/result";
import {
  addChecklistItemAction,
  markRoomConformingAction,
} from "@/app/(app)/vistorias/actions";
import { ChecklistRow, type ChecklistItemView } from "./checklist-row";
import { FindingSheet, type LibraryEntry } from "./finding-sheet";

type RoomFinding = {
  id: string;
  title: string;
  category: string;
  severity: string;
  photoCount: number;
};

const categoryOptions = toOptions(findingCategoryLabels);

/**
 * Tela de trabalho do ambiente — a que fica aberta enquanto a vistoria acontece.
 *
 * Prioridades, nesta ordem: avaliar e fotografar cada item, registrar ocorrência
 * quando houver problema, e só então reler o que já foi feito. Por isso o botão
 * de ocorrência é fixo no rodapé e tem a maior área de toque da tela.
 */
export function RoomWork({
  inspectionId,
  roomId,
  roomName,
  ratingScale,
  items,
  findings,
  library,
  navigation,
  aiEnabled,
}: {
  inspectionId: string;
  roomId: string;
  roomName: string;
  ratingScale: RatingScale;
  items: ChecklistItemView[];
  findings: RoomFinding[];
  library: LibraryEntry[];
  navigation: {
    previous: { id: string; name: string } | null;
    next: { id: string; name: string } | null;
    position: number;
    total: number;
  };
  aiEnabled: boolean;
}) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [suggestion, setSuggestion] = useState<{ category: string | null; title: string | null }>({
    category: null,
    title: null,
  });
  // Trocar a `key` da folha a cada abertura a remonta limpa, já com a sugestão
  // do item que originou a ação — sem efeito de reset.
  const [sheetSession, setSheetSession] = useState(0);

  function openFindingFor(item: ChecklistItemView | null) {
    setSuggestion({ category: item?.category ?? null, title: item?.label ?? null });
    setSheetSession((current) => current + 1);
    setSheetOpen(true);
  }

  const pendingCount = items.filter(
    (item) => item.status === ChecklistItemStatus.PENDENTE,
  ).length;
  const photoCount = items.reduce((total, item) => total + item.photos.length, 0);

  return (
    <div className="space-y-4 pb-20">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-ink-500">
          Ambiente {navigation.position} de {navigation.total}
          {photoCount > 0 ? ` · ${photoCount} ${photoCount === 1 ? "foto" : "fotos"}` : ""}
        </p>
        {pendingCount > 0 ? (
          <MarkAllButton
            inspectionId={inspectionId}
            roomId={roomId}
            pendingCount={pendingCount}
            ratingScale={ratingScale}
          />
        ) : (
          <Badge tone="success">Checklist completo</Badge>
        )}
      </div>

      {findings.length > 0 ? (
        <section className="rounded-card border border-ink-200 bg-surface">
          <h2 className="border-b border-ink-100 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-ink-500">
            Ocorrências neste ambiente ({findings.length})
          </h2>
          <ul className="divide-y divide-ink-100">
            {findings.map((finding) => (
              <li key={finding.id} className="flex items-start gap-3 px-4 py-3">
                <Badge tone={severityTones[finding.severity as Severity]}>
                  {severityLabels[finding.severity as Severity]}
                </Badge>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-ink-900">{finding.title}</p>
                  <p className="mt-0.5 text-xs text-ink-500">
                    {findingCategoryLabels[
                      finding.category as keyof typeof findingCategoryLabels
                    ] ?? finding.category}
                    {finding.photoCount > 0
                      ? ` · ${finding.photoCount} ${finding.photoCount === 1 ? "foto" : "fotos"}`
                      : " · sem foto"}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="rounded-card border border-ink-200 bg-surface">
        <div className="flex items-center justify-between gap-2 border-b border-ink-100 px-4 py-2.5">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-500">
            Checklist
          </h2>
          <AddItemSheet inspectionId={inspectionId} roomId={roomId} />
        </div>

        <ScaleLegend ratingScale={ratingScale} />

        {items.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-ink-500">
            Este ambiente ainda não tem itens. Use “Item” acima para incluir o que existe aqui.
          </p>
        ) : (
          <ul className="divide-y divide-ink-100">
            {items.map((item) => (
              <ChecklistRow
                key={item.id}
                item={item}
                inspectionId={inspectionId}
                roomId={roomId}
                ratingScale={ratingScale}
                onReportProblem={() => openFindingFor(item)}
              />
            ))}
          </ul>
        )}
      </section>

      <nav className="flex items-center justify-between gap-2">
        {navigation.previous ? (
          <Link
            href={`/vistorias/${inspectionId}/ambiente/${navigation.previous.id}`}
            className="inline-flex h-11 items-center gap-1 rounded-control border border-ink-200 bg-surface px-3 text-sm text-ink-700 transition-colors hover:bg-ink-50"
          >
            <ChevronRight className="size-4 rotate-180" />
            {navigation.previous.name}
          </Link>
        ) : (
          <span />
        )}
        {navigation.next ? (
          <Link
            href={`/vistorias/${inspectionId}/ambiente/${navigation.next.id}`}
            className="inline-flex h-11 items-center gap-1 rounded-control border border-ink-200 bg-surface px-3 text-sm text-ink-700 transition-colors hover:bg-ink-50"
          >
            {navigation.next.name}
            <ChevronRight className="size-4" />
          </Link>
        ) : (
          <Link
            href={`/vistorias/${inspectionId}`}
            className="inline-flex h-11 items-center gap-1 rounded-control border border-ink-200 bg-surface px-3 text-sm text-ink-700 transition-colors hover:bg-ink-50"
          >
            Concluir ambientes
            <ChevronRight className="size-4" />
          </Link>
        )}
      </nav>

      {/* Botão fixo: o alvo principal da tela durante a vistoria. */}
      <div className="fixed inset-x-0 bottom-16 z-30 border-t border-ink-200 bg-surface/95 px-4 py-3 pb-safe backdrop-blur lg:bottom-0 lg:left-60">
        <div className="mx-auto max-w-6xl">
          <Button size="lg" fullWidth onClick={() => openFindingFor(null)}>
            <Plus className="size-5" />
            Adicionar ocorrência
          </Button>
        </div>
      </div>

      <FindingSheet
        key={sheetSession}
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        inspectionId={inspectionId}
        roomId={roomId}
        roomName={roomName}
        library={library}
        suggestedCategory={suggestion.category}
        suggestedTitle={suggestion.title}
        aiEnabled={aiEnabled}
      />
    </div>
  );
}

/** Legenda das abreviações. Sem ela, "Reg." e "Péss." são adivinhação. */
function ScaleLegend({ ratingScale }: { ratingScale: RatingScale }) {
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1 border-b border-ink-100 bg-ink-50 px-4 py-1.5">
      {RATING_SCALE_VALUES[ratingScale].map((option) => (
        <span key={option} className="text-[0.6875rem] text-ink-500">
          <span className="font-semibold text-ink-700">{checklistItemStatusShort[option]}</span>{" "}
          {checklistItemStatusLabels[option]}
        </span>
      ))}
    </div>
  );
}

function MarkAllButton({
  inspectionId,
  roomId,
  pendingCount,
  ratingScale,
}: {
  inspectionId: string;
  roomId: string;
  pendingCount: number;
  ratingScale: RatingScale;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();

  const targetLabel =
    ratingScale === "CONFORMIDADE"
      ? checklistItemStatusLabels.OK
      : checklistItemStatusLabels.NOVO;

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await markRoomConformingAction({ roomId, inspectionId });
          if (result.ok) {
            toast(`${result.data.count} itens marcados como ${targetLabel.toLowerCase()}.`);
            router.refresh();
          } else {
            toast(result.error, "error");
          }
        })
      }
      className="inline-flex items-center gap-1.5 rounded-control border border-ink-200 bg-surface px-2.5 py-1.5 text-xs font-medium text-ink-600 transition-colors hover:bg-ink-50 disabled:opacity-50"
    >
      <CircleSlash className="size-3.5" />
      Marcar {pendingCount} restantes como {targetLabel.toLowerCase()}
    </button>
  );
}

/**
 * Inclusão de item em campo.
 *
 * O modelo cobre o caso comum; a realidade tem aquecedor a gás, automação,
 * terceiro lavabo. Incluir na hora é mais barato que manter um modelo por
 * padrão de acabamento.
 */
function AddItemSheet({ inspectionId, roomId }: { inspectionId: string; roomId: string }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const [state, formAction] = useActionState<ActionResult<unknown> | null, FormData>(
    async (previous: ActionResult<unknown> | null, formData: FormData) => {
      const result = await addChecklistItemAction(previous, formData);
      if (result.ok) {
        toast(result.message ?? "Item adicionado.");
        setOpen(false);
        router.refresh();
      }
      return result;
    },
    null,
  );

  const errors = state && !state.ok ? state.fieldErrors : undefined;
  const generalError = state && !state.ok && !state.fieldErrors ? state.error : null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 rounded-control border border-ink-200 bg-surface px-2.5 py-1.5 text-xs font-medium text-ink-600 transition-colors hover:bg-ink-50"
      >
        <Plus className="size-3.5" />
        Item
      </button>

      <Sheet open={open} onClose={() => setOpen(false)} title="Incluir item no checklist">
        <form action={formAction} className="space-y-4" noValidate>
          <input type="hidden" name="inspectionId" value={inspectionId} />
          <input type="hidden" name="roomId" value={roomId} />

          <FormError message={generalError} />

          <Field label="Item" htmlFor="item-label" error={errors?.label} required>
            <Input
              id="item-label"
              name="label"
              autoFocus
              placeholder="Aquecedor a gás, automação, terceiro lavabo…"
              invalid={Boolean(errors?.label)}
            />
          </Field>

          <Field
            label="Categoria"
            htmlFor="item-category"
            error={errors?.category}
            hint="Usada para pré-selecionar a categoria da ocorrência."
          >
            <Select
              id="item-category"
              name="category"
              options={categoryOptions}
              placeholder="Sem categoria"
            />
          </Field>

          <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <SubmitButton pendingLabel="Incluindo…">Incluir item</SubmitButton>
          </div>
        </form>
      </Sheet>
    </>
  );
}
