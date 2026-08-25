import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/guards";
import { listServiceTypeOptions } from "@/lib/services/catalog";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody } from "@/components/ui/card";
import { LeadForm } from "@/components/crm/lead-form";
import { createLeadAction } from "../actions";

export const metadata: Metadata = { title: "Novo lead" };

export default async function NewLeadPage() {
  await requireUser();
  const serviceOptions = await listServiceTypeOptions();

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <PageHeader
        title="Novo lead"
        description="Registre quem procurou e o que a pessoa precisa."
        backHref="/crm"
        backLabel="Funil"
      />

      <Card>
        <CardBody>
          <LeadForm
            action={createLeadAction}
            serviceOptions={serviceOptions}
            submitLabel="Criar lead"
            cancelHref="/crm"
          />
        </CardBody>
      </Card>
    </div>
  );
}
