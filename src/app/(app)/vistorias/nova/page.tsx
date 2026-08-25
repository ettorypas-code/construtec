import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/guards";
import { listClientOptions, listPropertyOptions } from "@/lib/services/clients";
import {
  getCompanySettings,
  listChecklistTemplateOptions,
  listServiceTypeOptions,
} from "@/lib/services/catalog";
import { allowedDocumentKinds } from "@/lib/compliance";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody } from "@/components/ui/card";
import { InspectionForm } from "@/components/inspection/inspection-form";
import { documentKindLabels } from "@/domain/labels";

export const metadata: Metadata = { title: "Nova vistoria" };

export default async function NewInspectionPage(props: PageProps<"/vistorias/nova">) {
  await requireUser();

  const searchParams = await props.searchParams;
  const clientId = typeof searchParams.clientId === "string" ? searchParams.clientId : undefined;
  const propertyId =
    typeof searchParams.propertyId === "string" ? searchParams.propertyId : undefined;

  const [clientOptions, propertyOptions, serviceOptions, templateOptions, company] =
    await Promise.all([
      listClientOptions(),
      listPropertyOptions(clientId ?? null),
      listServiceTypeOptions(),
      listChecklistTemplateOptions(),
      getCompanySettings(),
    ]);

  const documentKindOptions = allowedDocumentKinds(company).map((kind) => ({
    value: kind as string,
    label: documentKindLabels[kind],
  }));

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <PageHeader
        title="Nova vistoria"
        description="O checklist é montado a partir do modelo escolhido."
        backHref="/vistorias"
        backLabel="Vistorias"
      />

      <Card>
        <CardBody>
          <InspectionForm
            clientOptions={clientOptions}
            propertyOptions={propertyOptions}
            serviceOptions={serviceOptions}
            templateOptions={templateOptions}
            documentKindOptions={documentKindOptions}
            defaults={{ clientId, propertyId }}
          />
        </CardBody>
      </Card>
    </div>
  );
}
