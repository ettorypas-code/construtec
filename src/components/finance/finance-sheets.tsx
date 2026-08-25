"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, MoneyInput, Select, Textarea } from "@/components/ui/form";
import { FormError } from "@/components/ui/states";
import { SubmitButton } from "@/components/ui/submit-button";
import { Sheet } from "@/components/ui/sheet";
import { useToast } from "@/components/ui/toast";
import { ExpenseCategory, PaymentMethod } from "@/domain/enums";
import {
  expenseCategoryLabels,
  paymentMethodLabels,
  toOptions,
  type Option,
} from "@/domain/labels";
import type { ActionResult } from "@/lib/actions/result";
import {
  createExpenseAction,
  createPaymentAction,
  deleteExpenseAction,
  deletePaymentAction,
  settleExpenseAction,
  settlePaymentAction,
} from "@/app/(app)/financeiro/actions";

const categoryOptions = toOptions(expenseCategoryLabels);
const methodOptions = toOptions(paymentMethodLabels);

export function NewPaymentSheet({ clientOptions }: { clientOptions: Option<string>[] }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  // Fechar a folha acontece dentro da própria action, não em um efeito: o
  // resultado já chega aqui dentro da transição, e um `useEffect` observando
  // `state` só criaria uma renderização em cascata.
  const [state, formAction] = useActionState<ActionResult<unknown> | null, FormData>(
    async (previous: ActionResult<unknown> | null, formData: FormData) => {
      const result = await createPaymentAction(previous, formData);
      if (result.ok) {
        toast(result.message ?? "Recebimento lançado.");
        setOpen(false);
        router.refresh();
      }
      return result;
    },
    null,
  );

  const errors = state && !state.ok ? state.fieldErrors : undefined;
  // Sempre visível quando a ação falha. Mostrar só erros por campo esconde a
  // falha inteira quando o campo culpado não está renderizado na tela.
  const generalError = state && !state.ok ? state.error : null;

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus className="size-4" />
        Recebimento
      </Button>

      <Sheet open={open} onClose={() => setOpen(false)} title="Novo recebimento">
        <form action={formAction} className="space-y-4" noValidate>
          <FormError message={generalError} />

          <Field label="Descrição" htmlFor="payment-description" error={errors?.description} required>
            <Input
              id="payment-description"
              name="description"
              autoFocus
              placeholder="Vistoria de entrega — Marina Alencar"
              invalid={Boolean(errors?.description)}
            />
          </Field>

          <Field label="Cliente" htmlFor="payment-client" error={errors?.clientId}>
            <Select
              id="payment-client"
              name="clientId"
              options={clientOptions}
              placeholder="Sem cliente"
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Valor" htmlFor="payment-amount" error={errors?.amountCents} required>
              <MoneyInput
                id="payment-amount"
                name="amountCents"
                invalid={Boolean(errors?.amountCents)}
              />
            </Field>
            <Field label="Vencimento" htmlFor="payment-due" error={errors?.dueDate} required>
              <Input
                id="payment-due"
                name="dueDate"
                type="date"
                invalid={Boolean(errors?.dueDate)}
              />
            </Field>
          </div>

          <Field label="Observações" htmlFor="payment-notes" error={errors?.notes}>
            <Textarea id="payment-notes" name="notes" rows={2} />
          </Field>

          <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <SubmitButton pendingLabel="Lançando…">Lançar</SubmitButton>
          </div>
        </form>
      </Sheet>
    </>
  );
}

export function NewExpenseSheet() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  // Fechar a folha acontece dentro da própria action, não em um efeito: o
  // resultado já chega aqui dentro da transição, e um `useEffect` observando
  // `state` só criaria uma renderização em cascata.
  const [state, formAction] = useActionState<ActionResult<unknown> | null, FormData>(
    async (previous: ActionResult<unknown> | null, formData: FormData) => {
      const result = await createExpenseAction(previous, formData);
      if (result.ok) {
        toast(result.message ?? "Despesa lançada.");
        setOpen(false);
        router.refresh();
      }
      return result;
    },
    null,
  );

  const errors = state && !state.ok ? state.fieldErrors : undefined;
  // Sempre visível quando a ação falha. Mostrar só erros por campo esconde a
  // falha inteira quando o campo culpado não está renderizado na tela.
  const generalError = state && !state.ok ? state.error : null;

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Plus className="size-4" />
        Despesa
      </Button>

      <Sheet open={open} onClose={() => setOpen(false)} title="Nova despesa">
        <form action={formAction} className="space-y-4" noValidate>
          <FormError message={generalError} />

          <Field label="Descrição" htmlFor="expense-description" error={errors?.description} required>
            <Input
              id="expense-description"
              name="description"
              autoFocus
              placeholder="Combustível — visita à obra"
              invalid={Boolean(errors?.description)}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Categoria" htmlFor="expense-category" error={errors?.category}>
              <Select
                id="expense-category"
                name="category"
                options={categoryOptions}
                defaultValue={ExpenseCategory.TRANSPORTE}
              />
            </Field>
            <Field label="Fornecedor" htmlFor="expense-supplier" error={errors?.supplier}>
              <Input id="expense-supplier" name="supplier" />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Valor" htmlFor="expense-amount" error={errors?.amountCents} required>
              <MoneyInput
                id="expense-amount"
                name="amountCents"
                invalid={Boolean(errors?.amountCents)}
              />
            </Field>
            <Field label="Vencimento" htmlFor="expense-due" error={errors?.dueDate} required>
              <Input
                id="expense-due"
                name="dueDate"
                type="date"
                invalid={Boolean(errors?.dueDate)}
              />
            </Field>
          </div>

          <Field label="Observações" htmlFor="expense-notes" error={errors?.notes}>
            <Textarea id="expense-notes" name="notes" rows={2} />
          </Field>

          <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <SubmitButton pendingLabel="Lançando…">Lançar</SubmitButton>
          </div>
        </form>
      </Sheet>
    </>
  );
}

/**
 * Baixa de recebimento.
 *
 * A forma de pagamento é escolhida na hora da baixa, e não no lançamento —
 * quando o valor é previsto, ainda não se sabe como o cliente vai pagar.
 */
export function SettlePaymentButton({ paymentId }: { paymentId: string }) {
  const [open, setOpen] = useState(false);
  const [method, setMethod] = useState<string>(PaymentMethod.PIX);
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-8 items-center gap-1.5 rounded-control border border-success/30 bg-success-soft px-2.5 text-xs font-medium text-success transition-colors hover:brightness-95"
      >
        <Check className="size-3.5" />
        Baixar
      </button>

      <Sheet open={open} onClose={() => setOpen(false)} title="Confirmar recebimento">
        <div className="space-y-4">
          <Field label="Forma de pagamento" htmlFor="settle-method">
            <Select
              id="settle-method"
              options={methodOptions}
              value={method}
              onChange={(event) => setMethod(event.target.value)}
            />
          </Field>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button
              loading={pending}
              onClick={() =>
                startTransition(async () => {
                  const result = await settlePaymentAction({ id: paymentId, method });
                  if (result.ok) {
                    toast("Recebimento confirmado.");
                    setOpen(false);
                    router.refresh();
                  } else {
                    toast(result.error, "error");
                  }
                })
              }
            >
              Confirmar
            </Button>
          </div>
        </div>
      </Sheet>
    </>
  );
}

export function SettleExpenseButton({ expenseId }: { expenseId: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await settleExpenseAction({ id: expenseId });
          if (result.ok) {
            toast("Despesa marcada como paga.");
            router.refresh();
          } else {
            toast(result.error, "error");
          }
        })
      }
      className="inline-flex h-8 items-center gap-1.5 rounded-control border border-ink-200 bg-surface px-2.5 text-xs font-medium text-ink-600 transition-colors hover:bg-ink-50 disabled:opacity-50"
    >
      <Check className="size-3.5" />
      Pagar
    </button>
  );
}

export function DeleteEntryButton({
  id,
  kind,
}: {
  id: string;
  kind: "payment" | "expense";
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      aria-label="Excluir lançamento"
      onClick={() =>
        startTransition(async () => {
          const result =
            kind === "payment"
              ? await deletePaymentAction({ id })
              : await deleteExpenseAction({ id });
          if (result.ok) router.refresh();
          else toast(result.error, "error");
        })
      }
      className="-m-1 rounded p-1 text-ink-300 transition-colors hover:bg-danger-soft hover:text-danger disabled:opacity-50"
    >
      <Trash2 className="size-4" />
    </button>
  );
}
