"use client";

import { useActionState, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, MoneyInput, Select } from "@/components/ui/form";
import { FormError } from "@/components/ui/states";
import { SubmitButton } from "@/components/ui/submit-button";
import { Sheet } from "@/components/ui/sheet";
import { useToast } from "@/components/ui/toast";
import { Unit } from "@/domain/enums";
import { toOptions, unitDescriptions } from "@/domain/labels";
import { computeBudgetItem } from "@/lib/pricing/budget";
import { formatBRL, parseBRLToCents, parseQuantity } from "@/lib/utils/money";
import type { ActionResult } from "@/lib/actions/result";
import { addBudgetItemAction } from "@/app/(app)/orcamentos/actions";

const unitOptions = toOptions(unitDescriptions);

const EMPTY_PREVIEW = {
  quantity: "1",
  material: "",
  labor: "",
  equipment: "",
  waste: "0",
  bdi: "",
};

/**
 * Lançamento de item de orçamento.
 *
 * O resumo de cálculo é recalculado no cliente enquanto se digita, usando a
 * MESMA função que o servidor grava (`computeBudgetItem`). Ter uma segunda
 * fórmula "só para a prévia" é como divergências de centavo nascem.
 */
export function BudgetItemSheet({
  budgetId,
  defaultBdi,
}: {
  budgetId: string;
  defaultBdi: number;
}) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const [preview, setPreview] = useState(EMPTY_PREVIEW);

  // Fechar e limpar acontece dentro da própria action, não em um efeito: o
  // resultado já chega aqui dentro da transição, e um `useEffect` observando
  // `state` só criaria uma renderização em cascata.
  const [state, formAction] = useActionState<ActionResult<unknown> | null, FormData>(
    async (previous: ActionResult<unknown> | null, formData: FormData) => {
      const result = await addBudgetItemAction(previous, formData);
      if (result.ok) {
        toast(result.message ?? "Item adicionado.");
        setOpen(false);
        setPreview(EMPTY_PREVIEW);
      }
      return result;
    },
    null,
  );

  const computed = useMemo(() => {
    const bdiValue = preview.bdi.trim() === "" ? null : Number(preview.bdi.replace(",", "."));
    return computeBudgetItem(
      {
        quantity: parseQuantity(preview.quantity) ?? 0,
        materialUnitCents: parseBRLToCents(preview.material) ?? 0,
        laborUnitCents: parseBRLToCents(preview.labor) ?? 0,
        equipmentUnitCents: parseBRLToCents(preview.equipment) ?? 0,
        wastePercent: parseQuantity(preview.waste) ?? 0,
        bdiPercent: Number.isFinite(bdiValue) ? bdiValue : null,
      },
      defaultBdi,
    );
  }, [preview, defaultBdi]);

  const errors = state && !state.ok ? state.fieldErrors : undefined;
  // Sempre visível quando a ação falha. Mostrar só erros por campo esconde a
  // falha inteira quando o campo culpado não está renderizado na tela.
  const generalError = state && !state.ok ? state.error : null;

  const update = (field: keyof typeof preview) => (value: string) =>
    setPreview((current) => ({ ...current, [field]: value }));

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus className="size-4" />
        Item
      </Button>

      <Sheet open={open} onClose={() => setOpen(false)} title="Novo item" size="lg">
        <form action={formAction} className="space-y-4" noValidate>
          <input type="hidden" name="budgetId" value={budgetId} />

          <FormError message={generalError} />

          <div className="grid gap-4 sm:grid-cols-[8rem_1fr]">
            <Field label="Código" htmlFor="code" error={errors?.code}>
              <Input id="code" name="code" placeholder="87879" />
            </Field>
            <Field label="Serviço" htmlFor="description" error={errors?.description} required>
              <Input
                id="description"
                name="description"
                autoFocus
                placeholder="Revestimento cerâmico em parede"
                invalid={Boolean(errors?.description)}
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Etapa" htmlFor="groupName" error={errors?.groupName}>
              <Input id="groupName" name="groupName" placeholder="Acabamento" />
            </Field>
            <Field label="Unidade" htmlFor="unit" error={errors?.unit}>
              <Select id="unit" name="unit" options={unitOptions} defaultValue={Unit.M2} />
            </Field>
            <Field label="Quantidade" htmlFor="quantity" error={errors?.quantity} required>
              <Input
                id="quantity"
                name="quantity"
                inputMode="decimal"
                value={preview.quantity}
                onChange={(event) => update("quantity")(event.target.value)}
                className="tabular"
                invalid={Boolean(errors?.quantity)}
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Material (un.)" htmlFor="materialUnitCents">
              <MoneyInput
                id="materialUnitCents"
                name="materialUnitCents"
                value={preview.material}
                onChange={(event) => update("material")(event.target.value)}
              />
            </Field>
            <Field label="Mão de obra (un.)" htmlFor="laborUnitCents">
              <MoneyInput
                id="laborUnitCents"
                name="laborUnitCents"
                value={preview.labor}
                onChange={(event) => update("labor")(event.target.value)}
              />
            </Field>
            <Field label="Equipamento (un.)" htmlFor="equipmentUnitCents">
              <MoneyInput
                id="equipmentUnitCents"
                name="equipmentUnitCents"
                value={preview.equipment}
                onChange={(event) => update("equipment")(event.target.value)}
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Perdas (%)" htmlFor="wastePercent" hint="Incide sobre o custo direto.">
              <Input
                id="wastePercent"
                name="wastePercent"
                inputMode="decimal"
                value={preview.waste}
                onChange={(event) => update("waste")(event.target.value)}
                className="tabular"
              />
            </Field>
            <Field
              label="BDI do item (%)"
              htmlFor="bdiPercent"
              hint={`Vazio usa o BDI do orçamento (${defaultBdi}%).`}
            >
              <Input
                id="bdiPercent"
                name="bdiPercent"
                inputMode="decimal"
                value={preview.bdi}
                onChange={(event) => update("bdi")(event.target.value)}
                className="tabular"
                placeholder={String(defaultBdi)}
              />
            </Field>
          </div>

          {/* Prévia do cálculo, na ordem em que ele acontece. */}
          <div className="rounded-control border border-ink-200 bg-ink-50 px-3.5 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
              Cálculo
            </p>
            <dl className="mt-2 space-y-1 text-sm">
              <Row label="Custo direto unitário" value={formatBRL(computed.baseUnitCents)} />
              <Row label="Com perdas" value={formatBRL(computed.unitCostCents)} />
              <Row
                label={`Com BDI (${computed.effectiveBdiPercent}%)`}
                value={formatBRL(computed.unitSaleCents)}
              />
              <div className="mt-1.5 flex items-baseline justify-between border-t border-ink-200 pt-1.5">
                <dt className="font-medium text-ink-800">Total do item</dt>
                <dd className="text-base font-semibold tabular text-brand-700">
                  {formatBRL(computed.totalSaleCents)}
                </dd>
              </div>
            </dl>
          </div>

          <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <SubmitButton pendingLabel="Adicionando…">Adicionar item</SubmitButton>
          </div>
        </form>
      </Sheet>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between">
      <dt className="text-ink-500">{label}</dt>
      <dd className="tabular text-ink-800">{value}</dd>
    </div>
  );
}
