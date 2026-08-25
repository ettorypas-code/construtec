import type { Metadata } from "next";
import Link from "next/link";
import { addMonths } from "date-fns";
import { ChevronLeft, ChevronRight, TrendingDown, TrendingUp } from "lucide-react";
import { requireUser } from "@/lib/auth/guards";
import { getMonthSummary, listExpenses, listPayments } from "@/lib/services/finance";
import { listClientOptions } from "@/lib/services/clients";
import { sweepOverduePayments } from "@/lib/automation/engine";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/states";
import {
  DeleteEntryButton,
  NewExpenseSheet,
  NewPaymentSheet,
  SettleExpenseButton,
  SettlePaymentButton,
} from "@/components/finance/finance-sheets";
import { cn } from "@/lib/utils/cn";
import { formatBRL } from "@/lib/utils/money";
import { formatDate, formatMonthLabel, isOverdue, parseMonthParam, toMonthParam } from "@/lib/utils/dates";
import { expenseCategoryLabels, paymentMethodLabels } from "@/domain/labels";
import type { ExpenseCategory, PaymentMethod } from "@/domain/enums";

export const metadata: Metadata = { title: "Financeiro" };

export default async function FinancePage(props: PageProps<"/financeiro">) {
  await requireUser();

  const searchParams = await props.searchParams;
  const monthParam = typeof searchParams.mes === "string" ? searchParams.mes : undefined;
  const reference = parseMonthParam(monthParam);

  // Sem cron no MVP: a varredura de vencidos roda na abertura do financeiro,
  // que é a tela que a pessoa abre justamente para saber o que venceu.
  await sweepOverduePayments();

  const [summary, payments, expenses, clientOptions] = await Promise.all([
    getMonthSummary(reference),
    listPayments(reference),
    listExpenses(reference),
    listClientOptions(),
  ]);

  const previousMonth = toMonthParam(addMonths(reference, -1));
  const nextMonth = toMonthParam(addMonths(reference, 1));

  return (
    <div className="space-y-5">
      <PageHeader
        title="Financeiro"
        description="Recebimentos e despesas do mês."
        action={
          <div className="flex gap-2">
            <NewExpenseSheet />
            <NewPaymentSheet clientOptions={clientOptions} />
          </div>
        }
      />

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-ink-800 first-letter:uppercase">
          {formatMonthLabel(reference)}
        </p>
        <div className="flex items-center gap-1">
          <Link
            href={`/financeiro?mes=${previousMonth}`}
            aria-label="Mês anterior"
            className="flex size-9 items-center justify-center rounded-control border border-ink-200 bg-surface text-ink-600 transition-colors hover:bg-ink-50"
          >
            <ChevronLeft className="size-4" />
          </Link>
          <Link
            href="/financeiro"
            className="rounded-control border border-ink-200 bg-surface px-3 py-2 text-sm text-ink-700 transition-colors hover:bg-ink-50"
          >
            Mês atual
          </Link>
          <Link
            href={`/financeiro?mes=${nextMonth}`}
            aria-label="Próximo mês"
            className="flex size-9 items-center justify-center rounded-control border border-ink-200 bg-surface text-ink-600 transition-colors hover:bg-ink-50"
          >
            <ChevronRight className="size-4" />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Summary label="Recebido" value={summary.receivedCents} tone="positive" />
        <Summary label="A receber" value={summary.forecastCents} />
        <Summary
          label="Despesas"
          value={summary.expensesPaidCents + summary.expensesForecastCents}
        />
        <Summary
          label="Lucro estimado"
          value={summary.profitCents}
          tone={summary.profitCents < 0 ? "negative" : "positive"}
        />
      </div>

      {summary.overdueReceivableCents > 0 || summary.overduePayableCents > 0 ? (
        <div className="flex flex-wrap gap-3">
          {summary.overdueReceivableCents > 0 ? (
            <p className="flex items-center gap-2 rounded-control border border-danger/25 bg-danger-soft px-3 py-2 text-sm text-danger">
              <TrendingUp className="size-4 shrink-0" />
              {formatBRL(summary.overdueReceivableCents)} a receber em atraso
            </p>
          ) : null}
          {summary.overduePayableCents > 0 ? (
            <p className="flex items-center gap-2 rounded-control border border-warning/25 bg-warning-soft px-3 py-2 text-sm text-warning">
              <TrendingDown className="size-4 shrink-0" />
              {formatBRL(summary.overduePayableCents)} a pagar em atraso
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Recebimentos" description={`${payments.length} lançamentos`} />
          {payments.length === 0 ? (
            <EmptyState
              title="Nenhum recebimento no período"
              description="Propostas aceitas geram o recebimento previsto automaticamente."
            />
          ) : (
            <ul className="divide-y divide-ink-100">
              {payments.map((payment) => {
                const overdue = payment.status === "PREVISTO" && isOverdue(payment.dueDate);
                return (
                  <li key={payment.id} className="flex items-start gap-3 px-4 py-3 sm:px-5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink-900">
                        {payment.description}
                      </p>
                      <p
                        className={cn(
                          "mt-0.5 truncate text-xs",
                          overdue ? "font-medium text-danger" : "text-ink-500",
                        )}
                      >
                        {[
                          payment.client?.name,
                          payment.status === "RECEBIDO"
                            ? `recebido ${formatDate(payment.paidAt)}`
                            : `${overdue ? "venceu" : "vence"} ${formatDate(payment.dueDate)}`,
                          payment.method
                            ? paymentMethodLabels[payment.method as PaymentMethod]
                            : null,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <span className="text-sm font-semibold tabular text-ink-900">
                        {formatBRL(payment.amountCents)}
                      </span>
                      {payment.status === "PREVISTO" ? (
                        <SettlePaymentButton paymentId={payment.id} />
                      ) : (
                        <Badge tone="success">Recebido</Badge>
                      )}
                      <DeleteEntryButton id={payment.id} kind="payment" />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader title="Despesas" description={`${expenses.length} lançamentos`} />
          {expenses.length === 0 ? (
            <EmptyState
              title="Nenhuma despesa no período"
              description="Lance combustível, ferramentas e terceirizados para o lucro fazer sentido."
            />
          ) : (
            <ul className="divide-y divide-ink-100">
              {expenses.map((expense) => {
                const overdue = expense.status === "PREVISTA" && isOverdue(expense.dueDate);
                return (
                  <li key={expense.id} className="flex items-start gap-3 px-4 py-3 sm:px-5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink-900">
                        {expense.description}
                      </p>
                      <p
                        className={cn(
                          "mt-0.5 truncate text-xs",
                          overdue ? "font-medium text-warning" : "text-ink-500",
                        )}
                      >
                        {[
                          expenseCategoryLabels[expense.category as ExpenseCategory],
                          expense.supplier,
                          expense.status === "PAGA"
                            ? `paga ${formatDate(expense.paidAt)}`
                            : `${overdue ? "venceu" : "vence"} ${formatDate(expense.dueDate)}`,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <span className="text-sm font-semibold tabular text-ink-900">
                        {formatBRL(expense.amountCents)}
                      </span>
                      {expense.status === "PREVISTA" ? (
                        <SettleExpenseButton expenseId={expense.id} />
                      ) : (
                        <Badge>Paga</Badge>
                      )}
                      <DeleteEntryButton id={expense.id} kind="expense" />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

function Summary({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number;
  tone?: "default" | "positive" | "negative";
}) {
  return (
    <div className="rounded-card border border-ink-200 bg-surface px-4 py-3.5 shadow-subtle">
      <p className="text-xs font-medium uppercase tracking-wide text-ink-500">{label}</p>
      <p
        className={cn(
          "mt-1.5 text-xl font-semibold tabular tracking-tight",
          tone === "positive" && "text-success",
          tone === "negative" && "text-danger",
          tone === "default" && "text-ink-900",
        )}
      >
        {formatBRL(value)}
      </p>
    </div>
  );
}
