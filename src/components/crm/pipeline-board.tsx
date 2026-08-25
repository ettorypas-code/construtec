"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ArrowRightLeft, CalendarClock, Phone } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Sheet } from "@/components/ui/sheet";
import { useToast } from "@/components/ui/toast";
import { formatBRL } from "@/lib/utils/money";
import { relativeDayLabel } from "@/lib/utils/dates";
import { LeadStatus, PIPELINE_STAGES } from "@/domain/enums";
import { leadStatusLabels } from "@/domain/labels";
import { changeLeadStatusAction } from "@/app/(app)/crm/actions";
import type { PipelineColumn } from "@/lib/services/leads";

/**
 * Quadro do funil.
 *
 * Colunas com rolagem horizontal e scroll-snap — a mesma interface no celular e
 * no desktop. Não há arrastar-e-soltar de propósito: arrastar cartão em tela de
 * toque é impreciso, e mover o lead por um menu de dois toques é mais rápido e
 * funciona em qualquer tamanho de tela.
 */
export function PipelineBoard({ columns }: { columns: PipelineColumn[] }) {
  const [movingLead, setMovingLead] = useState<{ id: string; name: string; status: string } | null>(
    null,
  );

  return (
    <>
      <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 scrollbar-none sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0">
        {columns.map((column) => (
          <section
            key={column.status}
            className="flex w-[17rem] shrink-0 snap-start flex-col rounded-card border border-ink-200 bg-surface"
          >
            <header className="flex items-baseline justify-between gap-2 border-b border-ink-100 px-3 py-2.5">
              <div className="min-w-0">
                <h3 className="truncate text-sm font-medium text-ink-900">{column.label}</h3>
                {column.totalCents > 0 ? (
                  <p className="mt-0.5 text-xs tabular text-ink-500">
                    {formatBRL(column.totalCents)}
                  </p>
                ) : null}
              </div>
              <span className="shrink-0 rounded-full bg-ink-100 px-2 py-0.5 text-xs font-medium tabular text-ink-600">
                {column.leads.length}
              </span>
            </header>

            <div className="flex-1 space-y-2 p-2">
              {column.leads.length === 0 ? (
                <p className="px-1 py-6 text-center text-xs text-ink-400">Vazio</p>
              ) : (
                column.leads.map((lead) => (
                  <article
                    key={lead.id}
                    className="group rounded-control border border-ink-200 bg-paper p-2.5 transition-colors hover:border-ink-300"
                  >
                    <div className="flex items-start gap-2">
                      <Link href={`/crm/${lead.id}`} className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-ink-900">{lead.name}</p>
                        {lead.serviceName ? (
                          <p className="mt-0.5 truncate text-xs text-ink-500">{lead.serviceName}</p>
                        ) : null}
                      </Link>
                      <button
                        type="button"
                        aria-label={`Mover ${lead.name}`}
                        onClick={() =>
                          setMovingLead({ id: lead.id, name: lead.name, status: lead.status })
                        }
                        className="-m-1 shrink-0 rounded p-1 text-ink-400 transition-colors hover:bg-ink-200 hover:text-ink-700"
                      >
                        <ArrowRightLeft className="size-3.5" />
                      </button>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-ink-500">
                      {lead.potentialValueCents ? (
                        <span className="font-medium tabular text-ink-700">
                          {formatBRL(lead.potentialValueCents)}
                        </span>
                      ) : null}
                      {lead.nextContactAt ? (
                        <span className="inline-flex items-center gap-1">
                          <CalendarClock className="size-3" />
                          {relativeDayLabel(lead.nextContactAt)}
                        </span>
                      ) : null}
                      {lead.whatsapp ?? lead.phone ? (
                        <a
                          href={`https://wa.me/55${lead.whatsapp ?? lead.phone}`}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="inline-flex items-center gap-1 text-brand-600 hover:text-brand-700"
                        >
                          <Phone className="size-3" />
                          WhatsApp
                        </a>
                      ) : null}
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>
        ))}
      </div>

      <MoveLeadSheet lead={movingLead} onClose={() => setMovingLead(null)} />
    </>
  );
}

function MoveLeadSheet({
  lead,
  onClose,
}: {
  lead: { id: string; name: string; status: string } | null;
  onClose: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const { toast } = useToast();

  const stages = [...PIPELINE_STAGES, LeadStatus.PERDIDO];

  function move(status: LeadStatus) {
    if (!lead) return;
    startTransition(async () => {
      const result = await changeLeadStatusAction({
        id: lead.id,
        status,
        lostReason: "",
      });
      if (result.ok) {
        toast(`${lead.name} → ${leadStatusLabels[status]}`);
        onClose();
      } else {
        toast(result.error, "error");
      }
    });
  }

  return (
    <Sheet
      open={lead !== null}
      onClose={onClose}
      title="Mover lead"
      description={lead?.name}
    >
      <ul className="space-y-1">
        {stages.map((status) => {
          const current = lead?.status === status;
          return (
            <li key={status}>
              <button
                type="button"
                disabled={pending || current}
                onClick={() => move(status)}
                className={cn(
                  "flex h-touch-lg w-full items-center justify-between rounded-control px-3 text-left text-sm transition-colors",
                  current
                    ? "bg-brand-50 font-medium text-brand-700"
                    : "text-ink-700 hover:bg-ink-50 disabled:opacity-50",
                )}
              >
                {leadStatusLabels[status]}
                {current ? <span className="text-xs text-brand-600">atual</span> : null}
              </button>
            </li>
          );
        })}
      </ul>
    </Sheet>
  );
}
