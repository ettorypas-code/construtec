import type { Metadata } from "next";
import Link from "next/link";
import {
  CalendarClock,
  CircleAlert,
  ClipboardList,
  FileText,
  MapPin,
  Wallet,
} from "lucide-react";
import { requireUser } from "@/lib/auth/guards";
import {
  getBusinessPanel,
  getFinancePanel,
  getTodayPanel,
  getWorksPanel,
} from "@/lib/services/dashboard";
import { recentActivity } from "@/lib/services/activity";
import { buildDailyDigest, formatDigestText } from "@/lib/services/daily-digest";
import { getCompanySettings } from "@/lib/services/catalog";
import {
  DailyDigestCard,
  EmptyDigestCard,
} from "@/components/dashboard/daily-digest-card";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Stat, StatRow } from "@/components/ui/stat";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/states";
import { ButtonLink } from "@/components/ui/button";
import { formatBRL, formatPercent } from "@/lib/utils/money";
import { formatTime, relativeDayLabel } from "@/lib/utils/dates";
import { eventTypeLabels, eventTypeTones } from "@/domain/labels";
import type { EventType } from "@/domain/enums";

export const metadata: Metadata = { title: "Início" };

export default async function DashboardPage() {
  const user = await requireUser();

  const [today, business, works, finance, activity, digest, company] = await Promise.all([
    getTodayPanel(),
    getBusinessPanel(),
    getWorksPanel(),
    getFinancePanel(),
    recentActivity(10),
    buildDailyDigest(),
    getCompanySettings(),
  ]);

  const digestText = formatDigestText(digest, company.name);

  const hasAnyData =
    business.activePipeline > 0 ||
    works.inspectionsScheduled > 0 ||
    works.activeProjects > 0 ||
    finance.receivableCents > 0;

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight text-ink-900 sm:text-2xl">
          {greeting()}, {firstName(user.name)}
        </h1>
        <p className="text-sm text-ink-500">
          {today.events.length > 0
            ? `${today.events.length} ${today.events.length === 1 ? "compromisso" : "compromissos"} hoje.`
            : "Nenhum compromisso agendado para hoje."}
        </p>
      </header>

      {!hasAnyData ? <FirstRunGuide /> : null}

      {/* RESUMO DO DIA — o bloco que responde "o que eu faço hoje". */}
      {digest.empty ? (
        <EmptyDigestCard />
      ) : (
        <DailyDigestCard text={digestText} whatsappNumber={company.whatsapp ?? company.phone} />
      )}

      {/* HOJE ---------------------------------------------------------- */}
      <section className="space-y-3">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat
            label="Tarefas abertas"
            value={today.openTasks}
            hint={today.overdueTasks > 0 ? `${today.overdueTasks} em atraso` : "Em dia"}
            tone={today.overdueTasks > 0 ? "negative" : "default"}
            href="/agenda"
          />
          <Stat
            label="Follow-ups"
            value={today.followUpsDue}
            hint="Contatos a fazer"
            href="/crm"
          />
          <Stat
            label="Propostas abertas"
            value={today.proposalsAwaiting}
            hint="Aguardando resposta"
            href="/propostas"
          />
          <Stat
            label="Recebimentos vencidos"
            value={today.paymentsOverdue}
            tone={today.paymentsOverdue > 0 ? "negative" : "default"}
            href="/financeiro"
          />
        </div>

        <Card>
          <CardHeader
            title="Hoje"
            action={
              <Link
                href="/agenda"
                className="text-sm font-medium text-brand-600 transition-colors hover:text-brand-700"
              >
                Ver agenda
              </Link>
            }
          />
          {today.events.length === 0 ? (
            <EmptyState
              icon={<CalendarClock className="size-5" />}
              title="Agenda livre"
              description="Nenhum compromisso marcado para hoje."
              action={
                <ButtonLink href="/agenda" variant="outline" size="sm">
                  Agendar compromisso
                </ButtonLink>
              }
            />
          ) : (
            <ul className="divide-y divide-ink-100">
              {today.events.map((event) => (
                <li key={event.id} className="flex items-start gap-3 px-4 py-3 sm:px-5">
                  <span className="w-12 shrink-0 pt-0.5 text-sm font-medium tabular text-ink-800">
                    {formatTime(event.startsAt)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink-900">{event.title}</p>
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
          )}
        </Card>
      </section>

      {/* NEGÓCIOS / OBRAS ----------------------------------------------- */}
      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Negócios"
            description="Funil e conversão"
            action={
              <Link
                href="/crm"
                className="text-sm font-medium text-brand-600 transition-colors hover:text-brand-700"
              >
                Abrir CRM
              </Link>
            }
          />
          <CardBody className="space-y-0.5">
            <StatRow label="Leads no funil" value={business.activePipeline} />
            <StatRow label="Novos leads no mês" value={business.newLeadsThisMonth} />
            <StatRow
              label="Valor potencial"
              value={formatBRL(business.pipelineValueCents)}
              tone="positive"
            />
            <StatRow label="Propostas enviadas no mês" value={business.proposalsSent} />
            <StatRow label="Propostas aceitas no mês" value={business.proposalsAccepted} />
            <StatRow
              label="Taxa de conversão"
              value={business.conversionRate === null ? "—" : formatPercent(business.conversionRate)}
            />
            <StatRow
              label="Ticket médio"
              value={
                business.averageTicketCents === null
                  ? "—"
                  : formatBRL(business.averageTicketCents)
              }
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Execução"
            description="Vistorias e obras"
            action={
              <Link
                href="/vistorias"
                className="text-sm font-medium text-brand-600 transition-colors hover:text-brand-700"
              >
                Ver vistorias
              </Link>
            }
          />
          <CardBody className="space-y-0.5">
            <StatRow label="Vistorias agendadas" value={works.inspectionsScheduled} />
            <StatRow
              label="Vistorias em andamento"
              value={works.inspectionsInProgress}
              tone={works.inspectionsInProgress > 0 ? "positive" : "default"}
            />
            <StatRow label="Obras ativas" value={works.activeProjects} />
            <StatRow
              label="Obras com prazo estourado"
              value={works.lateProjects}
              tone={works.lateProjects > 0 ? "negative" : "default"}
            />
            <StatRow
              label="Pendências abertas"
              value={works.openFindings}
              tone={works.openFindings > 0 ? "negative" : "default"}
            />
          </CardBody>
        </Card>
      </section>

      {/* FINANCEIRO ------------------------------------------------------ */}
      <section className="space-y-3">
        <Card>
          <CardHeader
            title="Financeiro do mês"
            action={
              <Link
                href="/financeiro"
                className="text-sm font-medium text-brand-600 transition-colors hover:text-brand-700"
              >
                Abrir financeiro
              </Link>
            }
          />
          <CardBody>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-ink-500">Recebido</p>
                <p className="mt-1 text-xl font-semibold tabular text-success">
                  {formatBRL(finance.receivedThisMonthCents)}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-ink-500">A receber</p>
                <p className="mt-1 text-xl font-semibold tabular text-ink-900">
                  {formatBRL(finance.forecastThisMonthCents)}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-ink-500">Despesas</p>
                <p className="mt-1 text-xl font-semibold tabular text-ink-900">
                  {formatBRL(finance.expensesThisMonthCents)}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-ink-500">
                  Lucro estimado
                </p>
                <p
                  className={`mt-1 text-xl font-semibold tabular ${
                    finance.profitEstimateCents < 0 ? "text-danger" : "text-ink-900"
                  }`}
                >
                  {formatBRL(finance.profitEstimateCents)}
                </p>
              </div>
            </div>

            {finance.overdueReceivableCents > 0 ? (
              <p className="mt-4 flex items-center gap-2 rounded-control bg-danger-soft px-3 py-2 text-sm text-danger">
                <CircleAlert className="size-4 shrink-0" />
                {formatBRL(finance.overdueReceivableCents)} em recebimentos vencidos.
              </p>
            ) : null}
          </CardBody>
        </Card>
      </section>

      {/* ATIVIDADE ------------------------------------------------------- */}
      <section>
        <Card>
          <CardHeader title="Atividade recente" />
          {activity.length === 0 ? (
            <EmptyState
              icon={<ClipboardList className="size-5" />}
              title="Nada registrado ainda"
              description="Cada ação no sistema aparece aqui."
            />
          ) : (
            <ul className="divide-y divide-ink-100">
              {activity.map((entry) => (
                <li key={entry.id} className="flex items-baseline gap-3 px-4 py-2.5 sm:px-5">
                  <span className="w-11 shrink-0 text-xs tabular text-ink-400">
                    {formatTime(entry.createdAt)}
                  </span>
                  <p className="min-w-0 flex-1 text-sm text-ink-700">{entry.summary}</p>
                  <span className="shrink-0 text-xs text-ink-400">
                    {relativeDayLabel(entry.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>
    </div>
  );
}

/** Aparece só enquanto o sistema está vazio. Some sozinho quando há dados. */
function FirstRunGuide() {
  const steps = [
    {
      href: "/configuracoes",
      icon: FileText,
      title: "Configure sua empresa",
      description: "Dados, logo e habilitação profissional — usados em todo documento gerado.",
    },
    {
      href: "/crm/novo",
      icon: ClipboardList,
      title: "Registre o primeiro lead",
      description: "Ou receba automaticamente pelo formulário do site.",
    },
    {
      href: "/vistorias/nova",
      icon: CalendarClock,
      title: "Agende uma vistoria",
      description: "O checklist do imóvel é montado sozinho a partir do modelo.",
    },
    {
      href: "/financeiro",
      icon: Wallet,
      title: "Acompanhe o dinheiro",
      description: "Recebimentos e despesas, com o previsto do mês.",
    },
  ];

  return (
    <Card className="border-brand-200 bg-brand-50/40">
      <CardHeader
        title="Comece por aqui"
        description="Quatro passos para o sistema virar sua operação."
      />
      <CardBody>
        <ul className="grid gap-2 sm:grid-cols-2">
          {steps.map((step) => (
            <li key={step.href}>
              <Link
                href={step.href}
                className="flex h-full items-start gap-3 rounded-control bg-surface px-3.5 py-3 transition-colors hover:bg-ink-50"
              >
                <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                  <step.icon className="size-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-ink-900">{step.title}</span>
                  <span className="mt-0.5 block text-xs text-ink-500">{step.description}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </CardBody>
    </Card>
  );
}

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name;
}
