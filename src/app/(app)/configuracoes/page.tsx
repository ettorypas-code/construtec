import type { Metadata } from "next";
import { Sparkles } from "lucide-react";
import { requireUser } from "@/lib/auth/guards";
import { getCompanySettings } from "@/lib/services/catalog";
import { listAutomations } from "@/lib/services/automations";
import { getAiUsage } from "@/lib/services/ai";
import { isAiEnabled, aiModel } from "@/lib/ai/provider";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { StatRow } from "@/components/ui/stat";
import { CompanyForm } from "@/components/settings/company-form";
import { AutomationList } from "@/components/settings/automation-list";

export const metadata: Metadata = { title: "Configurações" };

export default async function SettingsPage() {
  await requireUser();

  const [company, automations, aiUsage] = await Promise.all([
    getCompanySettings(),
    listAutomations(),
    getAiUsage(),
  ]);

  const aiOn = isAiEnabled();

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <PageHeader
        title="Configurações"
        description="Dados da empresa, habilitação profissional e padrões comerciais."
      />

      <Card>
        <CardBody>
          <CompanyForm
            defaults={{
              name: company.name,
              legalName: company.legalName,
              document: company.document,
              email: company.email,
              phone: company.phone,
              whatsapp: company.whatsapp,
              website: company.website,
              addressLine: company.addressLine,
              city: company.city,
              state: company.state,
              zipCode: company.zipCode,
              professionalName: company.professionalName,
              professionalTitle: company.professionalTitle,
              councilType: company.councilType,
              councilNumber: company.councilNumber,
              canIssueArt: company.canIssueArt,
              defaultBdiPercent: company.defaultBdiPercent,
              defaultValidityDays: company.defaultValidityDays,
              defaultPaymentTerms: company.defaultPaymentTerms,
              proposalFooterNotes: company.proposalFooterNotes,
              reportFooterNotes: company.reportFooterNotes,
            }}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Automações"
          description="O que o sistema faz sozinho quando algo acontece."
        />
        <AutomationList automations={automations} />
      </Card>

      <Card>
        <CardHeader
          title="Inteligência artificial"
          description="Opcional. Sugere textos; nunca decide nem grava sozinha."
        />
        <CardBody className="space-y-3">
          <p
            className={`flex items-center gap-2 rounded-control border px-3 py-2.5 text-sm ${
              aiOn
                ? "border-brand-200 bg-brand-50 text-brand-700"
                : "border-ink-200 bg-ink-50 text-ink-600"
            }`}
          >
            <Sparkles className="size-4 shrink-0" />
            {aiOn
              ? `Ativa — modelo ${aiModel()}.`
              : "Desativada. Defina ANTHROPIC_API_KEY no ambiente para liberar as sugestões."}
          </p>

          {aiUsage.totalCalls > 0 ? (
            <div className="space-y-0.5">
              <StatRow label="Sugestões geradas" value={aiUsage.totalCalls} />
              <StatRow label="Aproveitadas" value={aiUsage.acceptedCalls} tone="positive" />
              <StatRow
                label="Falhas"
                value={aiUsage.failedCalls}
                tone={aiUsage.failedCalls > 0 ? "negative" : "muted"}
              />
              <StatRow
                label="Tokens"
                value={`${aiUsage.promptTokens} entrada · ${aiUsage.completionTokens} saída`}
              />
            </div>
          ) : (
            <p className="text-sm text-ink-500">Nenhuma sugestão gerada até agora.</p>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
