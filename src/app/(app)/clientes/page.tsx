import type { Metadata } from "next";
import Link from "next/link";
import { Search, Users } from "lucide-react";
import { requireUser } from "@/lib/auth/guards";
import { listClients } from "@/lib/services/clients";
import { PageHeader } from "@/components/ui/page-header";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/states";
import { clientKindLabels } from "@/domain/labels";
import type { ClientKind } from "@/domain/enums";

export const metadata: Metadata = { title: "Clientes" };

export default async function ClientsPage(props: PageProps<"/clientes">) {
  await requireUser();

  const searchParams = await props.searchParams;
  const rawSearch = searchParams.q;
  const search = typeof rawSearch === "string" && rawSearch.trim() !== "" ? rawSearch.trim() : undefined;

  const clients = await listClients(search);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Clientes"
        description={`${clients.length} ${clients.length === 1 ? "cliente" : "clientes"} cadastrados`}
        action={<ButtonLink href="/clientes/novo">Novo cliente</ButtonLink>}
      />

      <form method="get" className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-400" />
        <input
          type="search"
          name="q"
          defaultValue={search ?? ""}
          placeholder="Buscar por nome, e-mail ou documento"
          className="h-11 w-full rounded-control border border-ink-200 bg-surface pl-9 pr-3 text-ink-900 placeholder:text-ink-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 sm:h-10"
        />
      </form>

      {clients.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Users className="size-5" />}
            title={search ? "Nenhum cliente encontrado" : "Nenhum cliente cadastrado"}
            description={
              search
                ? "Tente outro termo de busca."
                : "Cadastre um cliente ou converta um lead do funil."
            }
            action={
              search ? (
                <ButtonLink href="/clientes" variant="outline" size="sm">
                  Limpar busca
                </ButtonLink>
              ) : (
                <ButtonLink href="/clientes/novo">Cadastrar cliente</ButtonLink>
              )
            }
          />
        </Card>
      ) : (
        <Card>
          <ul className="divide-y divide-ink-100">
            {clients.map((client) => (
              <li key={client.id}>
                <Link
                  href={`/clientes/${client.id}`}
                  className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-ink-50 sm:px-5"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-ink-100 text-xs font-semibold text-ink-600">
                    {client.name.slice(0, 2).toUpperCase()}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink-900">{client.name}</p>
                    <p className="mt-0.5 truncate text-xs text-ink-500">
                      {[
                        clientKindLabels[client.kind as ClientKind],
                        client.city,
                        client.email,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>

                  <div className="hidden shrink-0 items-center gap-2 sm:flex">
                    {client.propertyCount > 0 ? (
                      <Badge>
                        {client.propertyCount}{" "}
                        {client.propertyCount === 1 ? "imóvel" : "imóveis"}
                      </Badge>
                    ) : null}
                    {client.inspectionCount > 0 ? (
                      <Badge tone="brand">
                        {client.inspectionCount}{" "}
                        {client.inspectionCount === 1 ? "vistoria" : "vistorias"}
                      </Badge>
                    ) : null}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
