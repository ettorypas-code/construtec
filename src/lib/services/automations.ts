import "server-only";

import { db } from "@/lib/db";
import { logActivity } from "@/lib/services/activity";

export type AutomationSummary = {
  id: string;
  name: string;
  trigger: string;
  enabled: boolean;
  runCount: number;
  lastRunAt: Date | null;
  /** Descrição legível das ações, montada a partir do JSON gravado. */
  actionLabels: string[];
};

type StoredAction = {
  type?: unknown;
  title?: unknown;
  dueInDays?: unknown;
};

export async function listAutomations(): Promise<AutomationSummary[]> {
  const rules = await db.automationRule.findMany({ orderBy: { name: "asc" } });

  return rules.map((rule) => ({
    id: rule.id,
    name: rule.name,
    trigger: rule.trigger,
    enabled: rule.enabled,
    runCount: rule.runCount,
    lastRunAt: rule.lastRunAt,
    actionLabels: describeActions(rule.actions),
  }));
}

export async function setAutomationEnabled(id: string, enabled: boolean, userId: string) {
  const rule = await db.automationRule.update({ where: { id }, data: { enabled } });

  await logActivity({
    userId,
    action: "automation.toggled",
    summary: `Automação "${rule.name}" ${enabled ? "ativada" : "desativada"}`,
    entityType: "AutomationRule",
    entityId: rule.id,
  });

  return rule;
}

/**
 * Traduz o JSON de ações para frases.
 *
 * Guardar as ações como JSON permite adicionar tipos novos sem migração; o
 * custo é precisar desta tradução para exibir. Vale a troca enquanto o conjunto
 * de ações é pequeno.
 */
function describeActions(raw: string): string[] {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.map((entry) => {
      const action = entry as StoredAction;
      const title = typeof action.title === "string" ? action.title : "sem título";

      if (action.type === "CRIAR_TAREFA") {
        const days = typeof action.dueInDays === "number" ? action.dueInDays : 0;
        const prazo =
          days === 0 ? "para hoje" : days === 1 ? "para amanhã" : `em ${days} dias`;
        return `Criar tarefa "${title}" ${prazo}`;
      }

      if (action.type === "NOTIFICAR") return `Notificar: ${title}`;

      return title;
    });
  } catch {
    return [];
  }
}
