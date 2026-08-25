"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { formatBRL, formatQuantity } from "@/lib/utils/money";
import { unitLabels } from "@/domain/labels";
import type { Unit } from "@/domain/enums";
import { deleteBudgetItemAction } from "@/app/(app)/orcamentos/actions";

/**
 * Linha de item do orçamento.
 *
 * Mostra custo e venda lado a lado. Custo é informação interna — mas é ela que
 * responde "posso dar desconto aqui?", que é a pergunta real na hora de fechar.
 */
export function BudgetItemRow({
  budgetId,
  item,
}: {
  budgetId: string;
  item: {
    id: string;
    code: string | null;
    description: string;
    unit: string;
    quantity: number;
    wastePercent: number;
    bdiPercent: number | null;
    unitCostCents: number;
    unitSaleCents: number;
    totalCostCents: number;
    totalSaleCents: number;
  };
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();

  return (
    <li className="flex items-start gap-3 px-4 py-3 sm:px-5">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-ink-900">
          {item.code ? <span className="mr-1.5 font-mono text-xs text-ink-400">{item.code}</span> : null}
          {item.description}
        </p>
        <p className="mt-0.5 text-xs tabular text-ink-500">
          {formatQuantity(item.quantity)} {unitLabels[item.unit as Unit] ?? item.unit} ·{" "}
          {formatBRL(item.unitSaleCents)}/un
          {item.wastePercent > 0 ? ` · perdas ${item.wastePercent}%` : ""}
          {item.bdiPercent !== null ? ` · BDI ${item.bdiPercent}%` : ""}
        </p>
      </div>

      <div className="shrink-0 text-right">
        <p className="text-sm font-semibold tabular text-ink-900">
          {formatBRL(item.totalSaleCents)}
        </p>
        <p className="text-xs tabular text-ink-400">custo {formatBRL(item.totalCostCents)}</p>
      </div>

      <button
        type="button"
        disabled={pending}
        aria-label={`Remover ${item.description}`}
        onClick={() =>
          startTransition(async () => {
            const result = await deleteBudgetItemAction({ id: item.id, budgetId });
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
    </li>
  );
}
