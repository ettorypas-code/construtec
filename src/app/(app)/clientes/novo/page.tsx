import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/guards";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody } from "@/components/ui/card";
import { ClientForm } from "@/components/clients/client-form";
import { createClientAction } from "../actions";

export const metadata: Metadata = { title: "Novo cliente" };

export default async function NewClientPage() {
  await requireUser();

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <PageHeader
        title="Novo cliente"
        description="Dados usados em propostas, relatórios e cobranças."
        backHref="/clientes"
        backLabel="Clientes"
      />

      <Card>
        <CardBody>
          <ClientForm
            action={createClientAction}
            submitLabel="Cadastrar cliente"
            cancelHref="/clientes"
          />
        </CardBody>
      </Card>
    </div>
  );
}
