import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Calculator } from "lucide-react";
import { requireUser } from "@/lib/auth/guards";
import { getBudget } from "@/lib/services/budgets";
import { listClientOptions } from "@/lib/services/clients";
import { listServiceTypeOptions } from "@/lib/services/catalog";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/states";
import { StatRow } from "@/components/ui/stat";
import { BudgetForm } from "@/components/budget/budget-form";
import { BudgetItemSheet } from "@/components/budget/budget-item-sheet";
import { BudgetItemRow } from "@/components/budget/budget-item-row";
import { formatBRL, formatPercent, marginPercent } from "@/lib/utils/money";
import { updateBudgetAction } from "../actions";

export async function generateMetadata(props: PageProps<"/orcamentos/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  const budget = await getBudget(id);
  return { title: budget ? budget.name : "Orçamento" };
}

export default async function BudgetDetailPage(props: PageProps<"/orcamentos/[id]">) {
  await requireUser();
  const { id } = await props.params;

  const [budget, clientOptions, serviceOptions] = await Promise.all([
    getBudget(id),
    listClientOptions(),
    listServiceTypeOptions(),
  ]);
  if (!budget) notFound();

  const margin = marginPercent(budget.directCostCents, budget.saleTotalCents);

  // Itens agrupados por etapa, mantendo a ordem em que as etapas apareceram.
  const groups = new Map<string, typeof budget.items>();
  for (const item of budget.items) {
    const key = item.groupName ?? "Sem etapa";
    const list = groups.get(key) ?? [];
    list.push(item);
    groups.set(key, list);
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title={budget.name}
        backHref="/orcamentos"
        backLabel="Orçamentos"
        description={
          <span className="flex flex-wrap items-center gap-2">
            <span>BDI padrão {budget.bdiPercent}%</span>
            {budget.areaSqm ? <span>{budget.areaSqm} m²</span> : null}
            {budget.serviceType ? <span>{budget.serviceType.name}</span> : null}
            {budget.city ? <span>{budget.city}</span> : null}
            {budget.client ? (
              <Link
                href={`/clientes/${budget.client.id}`}
                className="text-brand-600 hover:text-brand-700"
              >
                {budget.client.name}
              </Link>
            ) : null}
            {budget.proposal ? (
              <Link
                href={`/propostas/${budget.proposal.id}`}
                className="text-brand-600 hover:text-brand-700"
              >
                Proposta {budget.proposal.number}
              </Link>
            ) : null}
          </span>
        }
        action={
          budget.proposal ? null : (
            <ButtonLink href={`/propostas/nova?budgetId=${budget.id}`} size="sm">
              Gerar proposta
            </ButtonLink>
          )
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_18rem]">
        <div className="space-y-4">
          <Card>
            <CardHeader
              title="Itens"
              description={`${budget.items.length} ${budget.items.length === 1 ? "item" : "itens"}`}
              action={<BudgetItemSheet budgetId={budget.id} defaultBdi={budget.bdiPercent} />}
            />

            {budget.items.length === 0 ? (
              <EmptyState
                icon={<Calculator className="size-5" />}
                title="Nenhum item lançado"
                description="Adicione serviços com quantidade, material, mão de obra, perdas e BDI. O preço de venda é calculado sozinho."
              />
            ) : (
              <div className="divide-y divide-ink-100">
                {[...groups.entries()].map(([groupName, items]) => (
                  <section key={groupName}>
                    <h3 className="bg-ink-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-ink-500 sm:px-5">
                      {groupName}
                    </h3>
                    <ul className="divide-y divide-ink-100">
                      {items.map((item) => (
                        <BudgetItemRow
                          key={item.id}
                          budgetId={budget.id}
                          item={{
                            id: item.id,
                            code: item.code,
                            description: item.description,
                            unit: item.unit,
                            quantity: item.quantity,
                            wastePercent: item.wastePercent,
                            bdiPercent: item.bdiPercent,
                            unitCostCents: item.unitCostCents,
                            unitSaleCents: item.unitSaleCents,
                            totalCostCents: item.totalCostCents,
                            totalSaleCents: item.totalSaleCents,
                          }}
                        />
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <CardHeader title="Dados do orçamento" />
            <CardBody>
              <BudgetForm
                action={updateBudgetAction}
                clientOptions={clientOptions}
                serviceOptions={serviceOptions}
                defaultBdi={budget.bdiPercent}
                submitLabel="Salvar alterações"
                cancelHref="/orcamentos"
                defaults={{
                  id: budget.id,
                  name: budget.name,
                  clientId: budget.clientId,
                  serviceTypeId: budget.serviceTypeId,
                  projectKind: budget.projectKind,
                  areaSqm: budget.areaSqm,
                  addressLine: budget.addressLine,
                  city: budget.city,
                  reference: budget.reference,
                  deadlineText: budget.deadlineText,
                  bdiPercent: budget.bdiPercent,
                  status: budget.status,
                  notes: budget.notes,
                }}
              />
            </CardBody>
          </Card>
        </div>

        <aside className="space-y-4">
          <Card>
            <CardHeader title="Resumo" />
            <CardBody className="space-y-0.5">
              <StatRow label="Material" value={formatBRL(budget.materialCents)} />
              <StatRow label="Mão de obra" value={formatBRL(budget.laborCents)} />
              <StatRow label="Equipamento" value={formatBRL(budget.equipmentCents)} />
              <StatRow label="Perdas" value={formatBRL(budget.wasteCents)} />

              <div className="my-2 border-t border-ink-100" />

              <StatRow label="Custo direto" value={formatBRL(budget.directCostCents)} />
              <StatRow label="BDI" value={formatBRL(budget.bdiCents)} />

              <div className="mt-3 flex items-baseline justify-between border-t border-ink-800 pt-2">
                <span className="text-sm font-medium text-ink-800">Preço de venda</span>
                <span className="text-lg font-semibold tabular text-brand-700">
                  {formatBRL(budget.saleTotalCents)}
                </span>
              </div>

              <StatRow
                label="Margem"
                value={margin === null ? "—" : formatPercent(margin)}
                tone={margin !== null && margin > 0 ? "positive" : "muted"}
              />

              <p className="mt-3 border-t border-ink-100 pt-3 text-xs leading-relaxed text-ink-500">
                Estes números são internos. O cliente vê apenas o preço de venda, na proposta.
              </p>
            </CardBody>
          </Card>
        </aside>
      </div>
    </div>
  );
}
