import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Building2, ClipboardCheck, FileText, Wallet } from "lucide-react";
import { requireUser } from "@/lib/auth/guards";
import { describeProperty, getClientDetail } from "@/lib/services/clients";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/states";
import { ClientForm } from "@/components/clients/client-form";
import { PropertySheet } from "@/components/clients/property-sheet";
import { formatBRL } from "@/lib/utils/money";
import { formatDate } from "@/lib/utils/dates";
import {
  clientKindLabels,
  inspectionStatusLabels,
  inspectionStatusTones,
  paymentStatusLabels,
  propertyKindLabels,
  proposalStatusLabels,
  proposalStatusTones,
} from "@/domain/labels";
import type {
  ClientKind,
  InspectionStatus,
  PaymentStatus,
  PropertyKind,
  ProposalStatus,
} from "@/domain/enums";
import { updateClientAction } from "../actions";

export async function generateMetadata(props: PageProps<"/clientes/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  const client = await getClientDetail(id);
  return { title: client ? client.name : "Cliente" };
}

export default async function ClientDetailPage(props: PageProps<"/clientes/[id]">) {
  await requireUser();
  const { id } = await props.params;

  const client = await getClientDetail(id);
  if (!client) notFound();

  return (
    <div className="space-y-5">
      <PageHeader
        title={client.name}
        backHref="/clientes"
        backLabel="Clientes"
        description={
          <span className="flex flex-wrap items-center gap-2">
            <Badge>{clientKindLabels[client.kind as ClientKind]}</Badge>
            {client.document ? <span>{client.document}</span> : null}
            {client.city ? <span>{client.city}</span> : null}
          </span>
        }
        action={
          <ButtonLink href={`/vistorias/nova?clientId=${client.id}`} size="sm">
            Agendar vistoria
          </ButtonLink>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-4">
          <Card>
            <CardHeader
              title="Imóveis"
              description="Usados como referência nas vistorias e obras."
              action={<PropertySheet clientId={client.id} />}
            />
            {client.properties.length === 0 ? (
              <EmptyState
                icon={<Building2 className="size-5" />}
                title="Nenhum imóvel cadastrado"
                description="Cadastre o imóvel para agilizar a criação de vistorias."
              />
            ) : (
              <ul className="divide-y divide-ink-100">
                {client.properties.map((property) => (
                  <li
                    key={property.id}
                    className="flex items-start justify-between gap-3 px-4 py-3 sm:px-5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink-900">
                        {describeProperty(property)}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-ink-500">
                        {[
                          propertyKindLabels[property.kind as PropertyKind],
                          property.areaSqm ? `${property.areaSqm} m²` : null,
                          property.addressLine,
                          property.city,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>
                    <ButtonLink
                      href={`/vistorias/nova?clientId=${client.id}&propertyId=${property.id}`}
                      variant="ghost"
                      size="sm"
                    >
                      Vistoriar
                    </ButtonLink>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <CardHeader title="Dados cadastrais" />
            <CardBody>
              <ClientForm
                action={updateClientAction}
                submitLabel="Salvar alterações"
                cancelHref="/clientes"
                defaults={{
                  id: client.id,
                  kind: client.kind,
                  name: client.name,
                  document: client.document,
                  email: client.email,
                  phone: client.phone,
                  whatsapp: client.whatsapp,
                  addressLine: client.addressLine,
                  district: client.district,
                  city: client.city,
                  state: client.state,
                  zipCode: client.zipCode,
                  notes: client.notes,
                }}
              />
            </CardBody>
          </Card>
        </div>

        <aside className="space-y-4">
          <Card>
            <CardHeader title="Vistorias" />
            {client.inspections.length === 0 ? (
              <EmptyState
                icon={<ClipboardCheck className="size-5" />}
                title="Nenhuma vistoria"
                className="py-8"
              />
            ) : (
              <ul className="divide-y divide-ink-100">
                {client.inspections.map((inspection) => (
                  <li key={inspection.id}>
                    <Link
                      href={`/vistorias/${inspection.id}`}
                      className="block px-4 py-3 transition-colors hover:bg-ink-50 sm:px-5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-medium text-ink-800">
                          {inspection.title}
                        </span>
                        <Badge tone={inspectionStatusTones[inspection.status as InspectionStatus]}>
                          {inspectionStatusLabels[inspection.status as InspectionStatus]}
                        </Badge>
                      </div>
                      <p className="mt-0.5 text-xs text-ink-500">
                        {inspection.scheduledAt ? formatDate(inspection.scheduledAt) : "Sem data"}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <CardHeader title="Propostas" />
            {client.proposals.length === 0 ? (
              <EmptyState icon={<FileText className="size-5" />} title="Nenhuma proposta" className="py-8" />
            ) : (
              <ul className="divide-y divide-ink-100">
                {client.proposals.map((proposal) => (
                  <li key={proposal.id}>
                    <Link
                      href={`/propostas/${proposal.id}`}
                      className="block px-4 py-3 transition-colors hover:bg-ink-50 sm:px-5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-medium text-ink-800">
                          {proposal.number}
                        </span>
                        <Badge tone={proposalStatusTones[proposal.status as ProposalStatus]}>
                          {proposalStatusLabels[proposal.status as ProposalStatus]}
                        </Badge>
                      </div>
                      <p className="mt-0.5 text-sm tabular text-ink-500">
                        {formatBRL(proposal.totalCents)}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <CardHeader title="Recebimentos" />
            {client.payments.length === 0 ? (
              <EmptyState icon={<Wallet className="size-5" />} title="Nenhum lançamento" className="py-8" />
            ) : (
              <ul className="divide-y divide-ink-100">
                {client.payments.map((payment) => (
                  <li key={payment.id} className="px-4 py-3 sm:px-5">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-sm text-ink-800">{payment.description}</span>
                      <span className="shrink-0 text-sm font-medium tabular text-ink-900">
                        {formatBRL(payment.amountCents)}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-ink-500">
                      {paymentStatusLabels[payment.status as PaymentStatus]} ·{" "}
                      {formatDate(payment.dueDate)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </aside>
      </div>
    </div>
  );
}
