import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { listClientOptions } from "@/lib/services/clients";
import { listBudgetOptions } from "@/lib/services/budgets";
import { listServiceTypeOptions } from "@/lib/services/catalog";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody } from "@/components/ui/card";
import { ProposalForm } from "@/components/proposal/proposal-form";
import { LeadStatus } from "@/domain/enums";
import { createProposalAction } from "../actions";

export const metadata: Metadata = { title: "Nova proposta" };

export default async function NewProposalPage(props: PageProps<"/propostas/nova">) {
  await requireUser();

  const searchParams = await props.searchParams;
  const leadId = typeof searchParams.leadId === "string" ? searchParams.leadId : undefined;
  const budgetId = typeof searchParams.budgetId === "string" ? searchParams.budgetId : undefined;
  const clientId = typeof searchParams.clientId === "string" ? searchParams.clientId : undefined;

  const [clientOptions, leads, serviceOptions, budgetOptions] = await Promise.all([
    listClientOptions(),
    db.lead.findMany({
      where: { status: { not: LeadStatus.PERDIDO } },
      orderBy: { updatedAt: "desc" },
      select: { id: true, name: true },
    }),
    listServiceTypeOptions(),
    listBudgetOptions(),
  ]);

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <PageHeader
        title="Nova proposta"
        description="Os itens são lançados depois — ou importados de um orçamento."
        backHref="/propostas"
        backLabel="Propostas"
      />

      <Card>
        <CardBody>
          <ProposalForm
            action={createProposalAction}
            clientOptions={clientOptions}
            leadOptions={leads.map((lead) => ({ value: lead.id, label: lead.name }))}
            serviceOptions={serviceOptions}
            budgetOptions={budgetOptions}
            defaults={{ leadId, budgetId, clientId }}
            submitLabel="Criar proposta"
            cancelHref="/propostas"
          />
        </CardBody>
      </Card>
    </div>
  );
}
