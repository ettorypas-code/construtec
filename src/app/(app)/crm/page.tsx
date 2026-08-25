import type { Metadata } from "next";
import Link from "next/link";
import { Users } from "lucide-react";
import { requireUser } from "@/lib/auth/guards";
import { getFunnelSummary, getLostLeads, getPipeline } from "@/lib/services/leads";
import { PageHeader } from "@/components/ui/page-header";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { Stat } from "@/components/ui/stat";
import { PipelineBoard } from "@/components/crm/pipeline-board";
import { formatBRL, formatPercent } from "@/lib/utils/money";

export const metadata: Metadata = { title: "CRM" };

export default async function CrmPage() {
  await requireUser();

  const [columns, summary, lostLeads] = await Promise.all([
    getPipeline(),
    getFunnelSummary(),
    getLostLeads(),
  ]);

  const totalInPipeline = columns.reduce((sum, column) => sum + column.leads.length, 0);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Funil de vendas"
        description="Do primeiro contato ao pós-venda."
        action={<ButtonLink href="/crm/novo">Novo lead</ButtonLink>}
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Leads novos" value={summary.newLeads} />
        <Stat label="Em negociação" value={summary.negotiations} />
        <Stat
          label="Valor potencial"
          value={formatBRL(summary.pipelineValueCents)}
          tone="positive"
        />
        <Stat
          label="Conversão"
          value={summary.conversionRate === null ? "—" : formatPercent(summary.conversionRate)}
          hint={`${summary.won} ganhos · ${summary.lost} perdidos`}
        />
      </div>

      {totalInPipeline === 0 ? (
        <Card>
          <EmptyState
            icon={<Users className="size-5" />}
            title="Nenhum lead no funil"
            description="Cadastre o primeiro contato ou receba automaticamente pelo formulário do site."
            action={<ButtonLink href="/crm/novo">Cadastrar lead</ButtonLink>}
          />
        </Card>
      ) : (
        <PipelineBoard columns={columns} />
      )}

      {lostLeads.length > 0 ? (
        <Card>
          <CardHeader
            title="Perdidos"
            description={`${lostLeads.length} ${lostLeads.length === 1 ? "lead" : "leads"} fora do funil`}
          />
          <ul className="divide-y divide-ink-100">
            {lostLeads.slice(0, 8).map((lead) => (
              <li key={lead.id}>
                <Link
                  href={`/crm/${lead.id}`}
                  className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-ink-50 sm:px-5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink-800">{lead.name}</p>
                    {lead.lostReason ? (
                      <p className="truncate text-xs text-ink-500">{lead.lostReason}</p>
                    ) : null}
                  </div>
                  {lead.potentialValueCents ? (
                    <span className="shrink-0 text-sm tabular text-ink-400">
                      {formatBRL(lead.potentialValueCents)}
                    </span>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
    </div>
  );
}
