import type { Metadata } from "next";
import Link from "next/link";
import { Calculator } from "lucide-react";
import { requireUser } from "@/lib/auth/guards";
import { listBudgets } from "@/lib/services/budgets";
import { PageHeader } from "@/components/ui/page-header";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/states";
import { formatBRL, formatPercent, marginPercent } from "@/lib/utils/money";
import { formatDate } from "@/lib/utils/dates";

export const metadata: Metadata = { title: "Orçamentos" };

const statusTones = {
  RASCUNHO: "neutral",
  FECHADO: "brand",
  CONVERTIDO: "success",
} as const;

const statusLabels = {
  RASCUNHO: "Rascunho",
  FECHADO: "Fechado",
  CONVERTIDO: "Convertido",
} as const;

export default async function BudgetsPage() {
  await requireUser();
  const budgets = await listBudgets();

  return (
    <div className="space-y-5">
      <PageHeader
        title="Orçamentos"
        description="Quantitativos, composição de custos e preço de venda."
        action={<ButtonLink href="/orcamentos/novo">Novo orçamento</ButtonLink>}
      />

      {budgets.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Calculator className="size-5" />}
            title="Nenhum orçamento"
            description="Monte o quantitativo com material, mão de obra, perdas e BDI — e transforme em proposta com um clique."
            action={<ButtonLink href="/orcamentos/novo">Criar orçamento</ButtonLink>}
          />
        </Card>
      ) : (
        <Card>
          <ul className="divide-y divide-ink-100">
            {budgets.map((budget) => {
              const margin = marginPercent(budget.directCostCents, budget.saleTotalCents);
              const status = budget.status as keyof typeof statusLabels;

              return (
                <li key={budget.id}>
                  <Link
                    href={`/orcamentos/${budget.id}`}
                    className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-ink-50 sm:px-5"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-medium text-ink-900">{budget.name}</p>
                        <Badge tone={statusTones[status] ?? "neutral"}>
                          {statusLabels[status] ?? budget.status}
                        </Badge>
                      </div>
                      <p className="mt-0.5 truncate text-xs text-ink-500">
                        {[
                          budget.client?.name,
                          `${budget._count.items} ${budget._count.items === 1 ? "item" : "itens"}`,
                          `BDI ${budget.bdiPercent}%`,
                          formatDate(budget.updatedAt),
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="text-sm font-semibold tabular text-ink-900">
                        {formatBRL(budget.saleTotalCents)}
                      </p>
                      {margin !== null ? (
                        <p className="text-xs tabular text-ink-500">
                          margem {formatPercent(margin, 0)}
                        </p>
                      ) : null}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </Card>
      )}
    </div>
  );
}
