import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, ChevronLeft, ChevronRight, ListChecks, MapPin } from "lucide-react";
import { addDays, addMonths, isSameDay, startOfDay } from "date-fns";
import { requireUser } from "@/lib/auth/guards";
import {
  listEvents,
  listTasks,
  rangeForView,
  taskLink,
  type CalendarView,
} from "@/lib/services/calendar";
import { listClientOptions } from "@/lib/services/clients";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/states";
import { TaskList } from "@/components/calendar/task-list";
import { NewEventSheet, NewTaskSheet } from "@/components/calendar/quick-add";
import { cn } from "@/lib/utils/cn";
import {
  formatDate,
  formatDayLabel,
  formatMonthLabel,
  formatTime,
  toDateInput,
} from "@/lib/utils/dates";
import { eventTypeLabels, eventTypeTones } from "@/domain/labels";
import type { EventType } from "@/domain/enums";

export const metadata: Metadata = { title: "Agenda" };

const views: Array<{ value: CalendarView; label: string }> = [
  { value: "dia", label: "Dia" },
  { value: "semana", label: "Semana" },
  { value: "mes", label: "Mês" },
];

export default async function AgendaPage(props: PageProps<"/agenda">) {
  await requireUser();

  const searchParams = await props.searchParams;
  const view = parseView(searchParams.view);
  const reference = parseDate(searchParams.data);

  const { start, end } = rangeForView(view, reference);

  const [events, tasks, clientOptions] = await Promise.all([
    listEvents(start, end),
    listTasks(),
    listClientOptions(),
  ]);

  const step = view === "mes" ? null : view === "semana" ? 7 : 1;
  const previous = step ? addDays(reference, -step) : addMonths(reference, -1);
  const next = step ? addDays(reference, step) : addMonths(reference, 1);

  // Eventos agrupados por dia: uma lista corrida por data lê melhor no celular
  // do que uma grade de calendário espremida.
  const days = groupByDay(events, start, end, view);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Agenda"
        description={rangeLabel(view, reference)}
        action={
          <div className="flex gap-2">
            <NewTaskSheet />
            <NewEventSheet clientOptions={clientOptions} />
          </div>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav className="flex gap-1 rounded-control border border-ink-200 bg-surface p-0.5">
          {views.map((item) => (
            <Link
              key={item.value}
              href={`/agenda?view=${item.value}&data=${toDateInput(reference)}`}
              className={cn(
                "rounded-[0.375rem] px-3 py-1.5 text-sm transition-colors",
                view === item.value
                  ? "bg-ink-900 font-medium text-white"
                  : "text-ink-600 hover:bg-ink-100",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          <Link
            href={`/agenda?view=${view}&data=${toDateInput(previous)}`}
            aria-label="Período anterior"
            className="flex size-9 items-center justify-center rounded-control border border-ink-200 bg-surface text-ink-600 transition-colors hover:bg-ink-50"
          >
            <ChevronLeft className="size-4" />
          </Link>
          <Link
            href={`/agenda?view=${view}`}
            className="rounded-control border border-ink-200 bg-surface px-3 py-2 text-sm text-ink-700 transition-colors hover:bg-ink-50"
          >
            Hoje
          </Link>
          <Link
            href={`/agenda?view=${view}&data=${toDateInput(next)}`}
            aria-label="Próximo período"
            className="flex size-9 items-center justify-center rounded-control border border-ink-200 bg-surface text-ink-600 transition-colors hover:bg-ink-50"
          >
            <ChevronRight className="size-4" />
          </Link>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_21rem]">
        <Card>
          <CardHeader
            title="Compromissos"
            description={`${events.length} no período`}
          />
          {events.length === 0 ? (
            <EmptyState
              icon={<CalendarDays className="size-5" />}
              title="Nada agendado neste período"
              description="Vistorias criadas com data entram aqui automaticamente."
            />
          ) : (
            <div className="divide-y divide-ink-100">
              {days.map((day) => (
                <section key={day.date.toISOString()}>
                  <h3
                    className={cn(
                      "px-4 py-1.5 text-xs font-semibold uppercase tracking-wider sm:px-5",
                      isSameDay(day.date, new Date())
                        ? "bg-brand-50 text-brand-700"
                        : "bg-ink-50 text-ink-500",
                    )}
                  >
                    {formatDayLabel(day.date)}
                    {isSameDay(day.date, new Date()) ? " · hoje" : ""}
                  </h3>
                  <ul className="divide-y divide-ink-100">
                    {day.events.map((event) => (
                      <li key={event.id} className="flex items-start gap-3 px-4 py-3 sm:px-5">
                        <span className="w-12 shrink-0 pt-0.5 text-sm font-medium tabular text-ink-800">
                          {event.allDay ? "dia" : formatTime(event.startsAt)}
                        </span>
                        <div className="min-w-0 flex-1">
                          <EventTitle event={event} />
                          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-500">
                            <Badge tone={eventTypeTones[event.type as EventType] ?? "neutral"}>
                              {eventTypeLabels[event.type as EventType] ?? event.type}
                            </Badge>
                            {event.clientName ? <span>{event.clientName}</span> : null}
                            {event.address ? (
                              <span className="inline-flex items-center gap-1">
                                <MapPin className="size-3" />
                                {event.address}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <CardHeader title="Tarefas" description={`${tasks.length} abertas`} />
          {tasks.length === 0 ? (
            <EmptyState
              icon={<ListChecks className="size-5" />}
              title="Nenhuma tarefa aberta"
              description="As automações criam tarefas sozinhas quando um lead chega ou uma proposta é enviada."
            />
          ) : (
            <TaskList
              tasks={tasks.map((task) => ({
                id: task.id,
                title: task.title,
                detail: task.detail,
                dueAt: task.dueAt,
                done: task.done,
                priority: task.priority,
                source: task.source,
                link: taskLink(task),
              }))}
            />
          )}
        </Card>
      </div>
    </div>
  );
}

function EventTitle({
  event,
}: {
  event: { title: string; inspectionId: string | null; projectId: string | null };
}) {
  // Obras é Fase 2: evento de obra existe no banco, mas ainda não tem tela.
  const href = event.inspectionId ? `/vistorias/${event.inspectionId}` : null;

  return href ? (
    <Link
      href={href}
      className="truncate text-sm font-medium text-ink-900 transition-colors hover:text-brand-700"
    >
      {event.title}
    </Link>
  ) : (
    <p className="truncate text-sm font-medium text-ink-900">{event.title}</p>
  );
}

type DayGroup = {
  date: Date;
  events: Awaited<ReturnType<typeof listEvents>>;
};

/**
 * Agrupa por dia. Na visão de dia mostramos o dia mesmo quando vazio; nas
 * outras, dias sem compromisso são omitidos para não gerar rolagem inútil.
 */
function groupByDay(
  events: Awaited<ReturnType<typeof listEvents>>,
  start: Date,
  end: Date,
  view: CalendarView,
): DayGroup[] {
  const groups: DayGroup[] = [];
  let cursor = startOfDay(start);

  while (cursor <= end) {
    const dayEvents = events.filter((event) => isSameDay(event.startsAt, cursor));
    if (dayEvents.length > 0 || view === "dia") {
      groups.push({ date: cursor, events: dayEvents });
    }
    cursor = addDays(cursor, 1);
  }

  return groups;
}

function parseView(value: string | string[] | undefined): CalendarView {
  const candidate = Array.isArray(value) ? value[0] : value;
  return candidate === "dia" || candidate === "semana" || candidate === "mes"
    ? candidate
    : "semana";
}

function parseDate(value: string | string[] | undefined): Date {
  const candidate = Array.isArray(value) ? value[0] : value;
  if (!candidate) return new Date();
  const parsed = new Date(`${candidate}T12:00:00`);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function rangeLabel(view: CalendarView, reference: Date): string {
  if (view === "mes") return formatMonthLabel(reference);
  if (view === "dia") return formatDayLabel(reference);
  const { start, end } = rangeForView("semana", reference);
  return `${formatDate(start)} — ${formatDate(end)}`;
}
