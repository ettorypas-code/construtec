import type { Metadata } from "next";
import Link from "next/link";
import { FileText } from "lucide-react";
import { requireUser } from "@/lib/auth/guards";
import { expireOverdueProposals, listProposals } from "@/lib/services/proposals";
import { PageHeader } from "@/components/ui/page-header";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/states";
import { formatBRL } from "@/lib/utils/money";
import { formatDate, relativeDayLabel } from "@/lib/utils/dates";
import { proposalStatusLabels, proposalStatusTones } from "@/domain/labels";
import type { ProposalStatus } from "@/domain/enums";

export const metadata: Metadata = { title: "Propostas" };

export default async function ProposalsPage() {
  await requireUser();

  // Sem cron no MVP: a varredura de validade roda quando a lista é aberta.
  await expireOverdueProposals();
  const proposals = await listProposals();

  return (
    <div className="space-y-5">
      <PageHeader
        title="Propostas"
        description="Do rascunho ao aceite do cliente."
        action={<ButtonLink href="/propostas/nova">Nova proposta</ButtonLink>}
      />

      {proposals.length === 0 ? (
        <Card>
          <EmptyState
            icon={<FileText className="size-5" />}
            title="Nenhuma proposta"
            description="Monte a proposta, gere o PDF e envie o link para o cliente aceitar."
            action={<ButtonLink href="/propostas/nova">Criar proposta</ButtonLink>}
          />
        </Card>
      ) : (
        <Card>
          <ul className="divide-y divide-ink-100">
            {proposals.map((proposal) => {
              const status = proposal.status as ProposalStatus;
              return (
                <li key={proposal.id}>
                  <Link
                    href={`/propostas/${proposal.id}`}
                    className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-ink-50 sm:px-5"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs text-ink-400">{proposal.number}</span>
                        <p className="truncate text-sm font-medium text-ink-900">
                          {proposal.title}
                        </p>
                        <Badge tone={proposalStatusTones[status]}>
                          {proposalStatusLabels[status]}
                        </Badge>
                      </div>
                      <p className="mt-0.5 truncate text-xs text-ink-500">
                        {[
                          proposal.client?.name ?? proposal.lead?.name,
                          proposal.sentAt ? `enviada ${relativeDayLabel(proposal.sentAt)}` : null,
                          proposal.validUntil ? `válida até ${formatDate(proposal.validUntil)}` : null,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>

                    <p className="shrink-0 text-sm font-semibold tabular text-ink-900">
                      {formatBRL(proposal.totalCents)}
                    </p>
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
