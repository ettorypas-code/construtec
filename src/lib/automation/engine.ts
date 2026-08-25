import "server-only";

import { addDays, startOfDay } from "date-fns";
import { db } from "@/lib/db";
import { logActivity } from "@/lib/services/activity";
import { eventSubject, type DomainEvent } from "./events";

/**
 * Motor de automações: QUANDO acontece X, FAZER Y.
 *
 * Roda no mesmo processo, logo após a operação que o disparou. Não é fila e não
 * tem retentativa — as ações são baratas (criar tarefa, criar notificação) e
 * uma fila só faria sentido se houvesse chamada externa. Quando entrar envio de
 * e-mail ou WhatsApp, é aqui que a fila entra, e só aqui.
 *
 * Falha de automação nunca derruba a operação principal: se a regra quebrar, o
 * lead continua criado.
 */

type AutomationAction =
  | {
      type: "CRIAR_TAREFA";
      title: string;
      detail?: string;
      dueInDays?: number;
      priority?: "BAIXA" | "NORMAL" | "ALTA";
    }
  | { type: "NOTIFICAR"; title: string; body?: string };

export async function emit(event: DomainEvent): Promise<void> {
  try {
    const rules = await db.automationRule.findMany({
      where: { trigger: event.type, enabled: true },
    });

    if (rules.length === 0) return;

    const subject = eventSubject(event);

    for (const rule of rules) {
      const actions = parseActions(rule.actions);
      for (const action of actions) {
        await runAction(action, subject);
      }

      await db.automationRule.update({
        where: { id: rule.id },
        data: { lastRunAt: new Date(), runCount: { increment: 1 } },
      });
    }
  } catch (error) {
    console.error(`[automation] falha ao processar ${event.type}`, error);
  }
}

async function runAction(
  action: AutomationAction,
  subject: ReturnType<typeof eventSubject>,
): Promise<void> {
  switch (action.type) {
    case "CRIAR_TAREFA": {
      await db.task.create({
        data: {
          title: `${action.title} — ${subject.label}`,
          detail: action.detail ?? null,
          dueAt: startOfDay(addDays(new Date(), action.dueInDays ?? 0)),
          priority: action.priority ?? "NORMAL",
          source: "AUTOMACAO",
          entityType: subject.entityType,
          entityId: subject.entityId,
        },
      });
      return;
    }

    case "NOTIFICAR": {
      const admins = await db.user.findMany({
        where: { role: "ADMIN", active: true },
        select: { id: true },
      });

      await db.notification.createMany({
        data: admins.map((admin) => ({
          userId: admin.id,
          title: action.title,
          body: action.body ? `${action.body} (${subject.label})` : subject.label,
          link: subject.link,
        })),
      });
      return;
    }
  }
}

function parseActions(raw: string): AutomationAction[] {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isAutomationAction);
  } catch {
    return [];
  }
}

function isAutomationAction(value: unknown): value is AutomationAction {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as { type?: unknown; title?: unknown };
  return (
    (candidate.type === "CRIAR_TAREFA" || candidate.type === "NOTIFICAR") &&
    typeof candidate.title === "string"
  );
}

/**
 * Varredura de pagamentos vencidos.
 *
 * Não existe cron no MVP: isto roda quando o dashboard financeiro é aberto, o
 * que na prática acontece todo dia útil. A marca `PAGAMENTO_VENCIDO:<id>` no
 * ActivityLog garante que cada pagamento só dispara uma vez.
 */
export async function sweepOverduePayments(): Promise<number> {
  const now = new Date();

  const overdue = await db.payment.findMany({
    where: { status: "PREVISTO", dueDate: { lt: now } },
    select: { id: true, description: true },
  });

  if (overdue.length === 0) return 0;

  const alreadyNotified = await db.activityLog.findMany({
    where: {
      action: "automation.payment_overdue",
      entityId: { in: overdue.map((payment) => payment.id) },
    },
    select: { entityId: true },
  });

  const notifiedIds = new Set(alreadyNotified.map((entry) => entry.entityId));
  const pending = overdue.filter((payment) => !notifiedIds.has(payment.id));

  for (const payment of pending) {
    await emit({
      type: "PAGAMENTO_VENCIDO",
      paymentId: payment.id,
      description: payment.description,
    });
    await logActivity({
      action: "automation.payment_overdue",
      summary: `Pagamento vencido: ${payment.description}`,
      entityType: "Payment",
      entityId: payment.id,
    });
  }

  return pending.length;
}
