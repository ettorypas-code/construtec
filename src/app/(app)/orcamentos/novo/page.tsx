import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/guards";
import { listClientOptions } from "@/lib/services/clients";
import { getCompanySettings, listServiceTypeOptions } from "@/lib/services/catalog";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody } from "@/components/ui/card";
import { BudgetForm } from "@/components/budget/budget-form";
import { createBudgetAction } from "../actions";

export const metadata: Metadata = { title: "Novo orçamento" };

export default async function NewBudgetPage() {
  await requireUser();

  const [clientOptions, serviceOptions, company] = await Promise.all([
    listClientOptions(),
    listServiceTypeOptions(),
    getCompanySettings(),
  ]);

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <PageHeader
        title="Novo orçamento"
        description="Sua planilha de custo. Vira proposta depois, com um clique."
        backHref="/orcamentos"
        backLabel="Orçamentos"
      />

      <p className="rounded-card border border-ink-200 bg-ink-50 px-4 py-3 text-sm leading-relaxed text-ink-600">
        <strong className="font-medium text-ink-800">Orçamento é interno.</strong> Ele guarda
        material, mão de obra, perdas, BDI e a sua margem — e nunca vai para o cliente. O que o
        cliente recebe é a <strong className="font-medium text-ink-800">proposta</strong>, que
        mostra só o preço final. Para serviço simples, pule esta tela e crie a proposta direto.
      </p>

      <Card>
        <CardBody>
          <BudgetForm
            action={createBudgetAction}
            clientOptions={clientOptions}
            serviceOptions={serviceOptions}
            defaultBdi={company.defaultBdiPercent}
            submitLabel="Criar orçamento"
            cancelHref="/orcamentos"
          />
        </CardBody>
      </Card>
    </div>
  );
}
