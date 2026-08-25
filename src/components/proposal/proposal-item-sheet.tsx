"use client";

import { useActionState, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input, MoneyInput, Select } from "@/components/ui/form";
import { FormError } from "@/components/ui/states";
import { SubmitButton } from "@/components/ui/submit-button";
import { Sheet } from "@/components/ui/sheet";
import { useToast } from "@/components/ui/toast";
import { Unit } from "@/domain/enums";
import { toOptions, unitDescriptions, unitLabels } from "@/domain/labels";
import { formatBRL, formatQuantity } from "@/lib/utils/money";
import type { ActionResult } from "@/lib/actions/result";
import {
  addProposalItemAction,
  deleteProposalItemAction,
} from "@/app/(app)/propostas/actions";

const unitOptions = toOptions(unitDescriptions);

export function ProposalItemSheet({ proposalId }: { proposalId: string }) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  // Fechar a folha acontece dentro da própria action, não em um efeito: o
  // resultado já chega aqui dentro da transição, e um `useEffect` observando
  // `state` só criaria uma renderização em cascata.
  const [state, formAction] = useActionState<ActionResult<unknown> | null, FormData>(
    async (previous: ActionResult<unknown> | null, formData: FormData) => {
      const result = await addProposalItemAction(previous, formData);
      if (result.ok) {
        toast(result.message ?? "Item adicionado.");
        setOpen(false);
      }
      return result;
    },
    null,
  );

  const errors = state && !state.ok ? state.fieldErrors : undefined;
  // Sempre visível quando a ação falha. Mostrar só erros por campo esconde a
  // falha inteira quando o campo culpado não está renderizado na tela.
  const generalError = state && !state.ok ? state.error : null;

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus className="size-4" />
        Item
      </Button>

      <Sheet open={open} onClose={() => setOpen(false)} title="Novo item da proposta">
        <form action={formAction} className="space-y-4" noValidate>
          <input type="hidden" name="proposalId" value={proposalId} />

          <FormError message={generalError} />

          <Field label="Descrição" htmlFor="description" error={errors?.description} required>
            <Input
              id="description"
              name="description"
              autoFocus
              placeholder="Vistoria de entrega de chaves"
              invalid={Boolean(errors?.description)}
            />
          </Field>

          <Field label="Detalhe" htmlFor="detail" error={errors?.detail}>
            <Input
              id="detail"
              name="detail"
              placeholder="Inclui relatório fotográfico em PDF"
            />
          </Field>

          <div className="grid grid-cols-3 gap-4">
            <Field label="Unidade" htmlFor="unit" error={errors?.unit}>
              <Select id="unit" name="unit" options={unitOptions} defaultValue={Unit.VB} />
            </Field>
            <Field label="Quantidade" htmlFor="quantity" error={errors?.quantity} required>
              <Input
                id="quantity"
                name="quantity"
                inputMode="decimal"
                defaultValue="1"
                className="tabular"
                invalid={Boolean(errors?.quantity)}
              />
            </Field>
            <Field label="Valor unitário" htmlFor="unitPriceCents" error={errors?.unitPriceCents} required>
              <MoneyInput
                id="unitPriceCents"
                name="unitPriceCents"
                invalid={Boolean(errors?.unitPriceCents)}
              />
            </Field>
          </div>

          <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <SubmitButton pendingLabel="Adicionando…">Adicionar</SubmitButton>
          </div>
        </form>
      </Sheet>
    </>
  );
}

export function ProposalItemRow({
  proposalId,
  item,
  editable,
}: {
  proposalId: string;
  item: {
    id: string;
    description: string;
    detail: string | null;
    unit: string;
    quantity: number;
    unitPriceCents: number;
    totalCents: number;
  };
  editable: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();

  return (
    <li className="flex items-start gap-3 px-4 py-3 sm:px-5">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-ink-900">{item.description}</p>
        <p className="mt-0.5 text-xs tabular text-ink-500">
          {formatQuantity(item.quantity)} {unitLabels[item.unit as Unit] ?? item.unit} ×{" "}
          {formatBRL(item.unitPriceCents)}
          {item.detail ? ` · ${item.detail}` : ""}
        </p>
      </div>

      <p className="shrink-0 text-sm font-semibold tabular text-ink-900">
        {formatBRL(item.totalCents)}
      </p>

      {editable ? (
        <button
          type="button"
          disabled={pending}
          aria-label={`Remover ${item.description}`}
          onClick={() =>
            startTransition(async () => {
              const result = await deleteProposalItemAction({ id: item.id, proposalId });
              if (result.ok) {
                toast("Item removido.");
                router.refresh();
              } else {
                toast(result.error, "error");
              }
            })
          }
          className="-m-1 shrink-0 rounded p-1 text-ink-300 transition-colors hover:bg-danger-soft hover:text-danger disabled:opacity-50"
        >
          <Trash2 className="size-4" />
        </button>
      ) : null}
    </li>
  );
}
