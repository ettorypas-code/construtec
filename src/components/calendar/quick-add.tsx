"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarPlus, ListPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { FormError } from "@/components/ui/states";
import { SubmitButton } from "@/components/ui/submit-button";
import { Sheet } from "@/components/ui/sheet";
import { useToast } from "@/components/ui/toast";
import { EventStatus, EventType, TaskPriority } from "@/domain/enums";
import { eventTypeLabels, taskPriorityLabels, toOptions, type Option } from "@/domain/labels";
import type { ActionResult } from "@/lib/actions/result";
import { createEventAction, createTaskAction } from "@/app/(app)/agenda/actions";

const eventTypeOptions = toOptions(eventTypeLabels);
const priorityOptions = toOptions(taskPriorityLabels);

export function NewEventSheet({ clientOptions }: { clientOptions: Option<string>[] }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  // Fechar a folha acontece dentro da própria action, não em um efeito: o
  // resultado já chega aqui dentro da transição, e um `useEffect` observando
  // `state` só criaria uma renderização em cascata.
  const [state, formAction] = useActionState<ActionResult<unknown> | null, FormData>(
    async (previous: ActionResult<unknown> | null, formData: FormData) => {
      const result = await createEventAction(previous, formData);
      if (result.ok) {
        toast(result.message ?? "Compromisso agendado.");
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
        <CalendarPlus className="size-4" />
        Compromisso
      </Button>

      <Sheet open={open} onClose={() => setOpen(false)} title="Novo compromisso">
        <form action={formAction} className="space-y-4" noValidate>
          <input type="hidden" name="status" value={EventStatus.AGENDADO} />

          <FormError message={generalError} />

          <Field label="Título" htmlFor="event-title" error={errors?.title} required>
            <Input
              id="event-title"
              name="title"
              autoFocus
              placeholder="Vistoria — Residencial Aurora, 1204"
              invalid={Boolean(errors?.title)}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Tipo" htmlFor="event-type" error={errors?.type}>
              <Select
                id="event-type"
                name="type"
                options={eventTypeOptions}
                defaultValue={EventType.VISITA}
              />
            </Field>

            <Field label="Cliente" htmlFor="event-client" error={errors?.clientId}>
              <Select
                id="event-client"
                name="clientId"
                options={clientOptions}
                placeholder="Sem cliente"
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Início" htmlFor="event-start" error={errors?.startsAt} required>
              <Input
                id="event-start"
                name="startsAt"
                type="datetime-local"
                invalid={Boolean(errors?.startsAt)}
              />
            </Field>
            <Field label="Fim" htmlFor="event-end" error={errors?.endsAt}>
              <Input id="event-end" name="endsAt" type="datetime-local" />
            </Field>
          </div>

          <Field label="Endereço" htmlFor="event-address" error={errors?.address}>
            <Input id="event-address" name="address" placeholder="Onde é o compromisso" />
          </Field>

          <Field label="Observações" htmlFor="event-notes" error={errors?.notes}>
            <Textarea id="event-notes" name="notes" rows={2} />
          </Field>

          <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <SubmitButton pendingLabel="Agendando…">Agendar</SubmitButton>
          </div>
        </form>
      </Sheet>
    </>
  );
}

export function NewTaskSheet() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  // Fechar a folha acontece dentro da própria action, não em um efeito: o
  // resultado já chega aqui dentro da transição, e um `useEffect` observando
  // `state` só criaria uma renderização em cascata.
  const [state, formAction] = useActionState<ActionResult<unknown> | null, FormData>(
    async (previous: ActionResult<unknown> | null, formData: FormData) => {
      const result = await createTaskAction(previous, formData);
      if (result.ok) {
        toast(result.message ?? "Tarefa criada.");
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
        <ListPlus className="size-4" />
        Tarefa
      </Button>

      <Sheet open={open} onClose={() => setOpen(false)} title="Nova tarefa">
        <form action={formAction} className="space-y-4" noValidate>
          <FormError message={generalError} />

          <Field label="Tarefa" htmlFor="task-title" error={errors?.title} required>
            <Input
              id="task-title"
              name="title"
              autoFocus
              placeholder="Ligar para o síndico"
              invalid={Boolean(errors?.title)}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Vencimento" htmlFor="task-due" error={errors?.dueAt}>
              <Input id="task-due" name="dueAt" type="date" />
            </Field>
            <Field label="Prioridade" htmlFor="task-priority" error={errors?.priority}>
              <Select
                id="task-priority"
                name="priority"
                options={priorityOptions}
                defaultValue={TaskPriority.NORMAL}
              />
            </Field>
          </div>

          <Field label="Detalhe" htmlFor="task-detail" error={errors?.detail}>
            <Textarea id="task-detail" name="detail" rows={2} />
          </Field>

          <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <SubmitButton pendingLabel="Criando…">Criar tarefa</SubmitButton>
          </div>
        </form>
      </Sheet>
    </>
  );
}
