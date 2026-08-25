"use client";

import { useOptimistic, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Zap } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useToast } from "@/components/ui/toast";
import { automationTriggerLabels } from "@/domain/labels";
import type { AutomationTrigger } from "@/domain/enums";
import { formatDateTime } from "@/lib/utils/dates";
import { toggleAutomationAction } from "@/app/(app)/configuracoes/actions-automation";

export type AutomationRow = {
  id: string;
  name: string;
  trigger: string;
  enabled: boolean;
  runCount: number;
  lastRunAt: Date | null;
  actionLabels: string[];
};

/**
 * Regras QUANDO → FAZER.
 *
 * Só ligar e desligar: criar regra pela interface exigiria um editor de
 * condições e ações que ninguém usaria com seis regras. Quando o conjunto
 * crescer, o editor se justifica — hoje, não.
 */
export function AutomationList({ automations }: { automations: AutomationRow[] }) {
  return (
    <ul className="divide-y divide-ink-100">
      {automations.map((automation) => (
        <AutomationRowItem key={automation.id} automation={automation} />
      ))}
    </ul>
  );
}

function AutomationRowItem({ automation }: { automation: AutomationRow }) {
  const router = useRouter();
  const { toast } = useToast();
  const [, startTransition] = useTransition();
  const [enabled, setEnabled] = useOptimistic(automation.enabled);

  return (
    <li className="flex items-start gap-3 px-4 py-3.5 sm:px-5">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-medium text-ink-900">{automation.name}</p>
          <span className="inline-flex items-center gap-1 rounded-full bg-ink-100 px-2 py-0.5 text-xs text-ink-600">
            <Zap className="size-3" />
            {automationTriggerLabels[automation.trigger as AutomationTrigger] ??
              automation.trigger}
          </span>
        </div>

        <ul className="mt-1 space-y-0.5">
          {automation.actionLabels.map((label) => (
            <li key={label} className="text-xs text-ink-500">
              → {label}
            </li>
          ))}
        </ul>

        {automation.runCount > 0 ? (
          <p className="mt-1 text-xs text-ink-400">
            Disparou {automation.runCount}×
            {automation.lastRunAt ? ` · última vez ${formatDateTime(automation.lastRunAt)}` : ""}
          </p>
        ) : null}
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-label={`${enabled ? "Desativar" : "Ativar"} ${automation.name}`}
        onClick={() =>
          startTransition(async () => {
            setEnabled(!enabled);
            const result = await toggleAutomationAction({
              id: automation.id,
              enabled: !enabled,
            });
            if (result.ok) router.refresh();
            else toast(result.error, "error");
          })
        }
        className={cn(
          "relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors",
          enabled ? "bg-brand-600" : "bg-ink-300",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 size-5 rounded-full bg-white shadow-subtle transition-all",
            enabled ? "left-[1.375rem]" : "left-0.5",
          )}
        />
      </button>
    </li>
  );
}
