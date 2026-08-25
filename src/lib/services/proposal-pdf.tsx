import "server-only";

import { renderToBuffer } from "@react-pdf/renderer";
import { db } from "@/lib/db";
import { getCompanySettings } from "@/lib/services/catalog";
import { BusinessError } from "@/lib/actions/result";
import { formatDate } from "@/lib/utils/dates";
import { ProposalDocument, type ProposalPdfData } from "@/lib/pdf/proposal";

/**
 * Monta e renderiza o PDF da proposta.
 *
 * Diferente do relatório de vistoria, a proposta não é versionada em disco: ela
 * é gerada sob demanda a partir do estado atual. O que o cliente vê no link
 * público e o que sai no PDF são sempre a mesma coisa — e propostas mudam até
 * serem aceitas.
 */
export async function renderProposalPdf(proposalId: string): Promise<Buffer> {
  const [proposal, company] = await Promise.all([
    db.proposal.findUnique({
      where: { id: proposalId },
      include: {
        client: true,
        lead: { select: { name: true } },
        serviceType: { select: { name: true, legalNotes: true } },
        items: { orderBy: { sortOrder: "asc" } },
      },
    }),
    getCompanySettings(),
  ]);

  if (!proposal) throw new BusinessError("Proposta não encontrada.");

  const data: ProposalPdfData = {
    number: proposal.number,
    title: proposal.title,
    issuedAt: formatDate(proposal.sentAt ?? proposal.createdAt),
    validUntil: proposal.validUntil ? formatDate(proposal.validUntil) : null,
    company: {
      name: company.name,
      document: company.document,
      phone: company.phone,
      email: company.email,
      website: company.website,
      address:
        [company.addressLine, company.city, company.state].filter(Boolean).join(", ") || null,
      professionalLine:
        company.councilNumber && company.councilType !== "NENHUM"
          ? `${company.councilType} ${company.councilNumber}`
          : null,
    },
    clientName: proposal.client?.name ?? proposal.lead?.name ?? "Cliente",
    clientDocument: proposal.client?.document ?? null,
    clientAddress: proposal.client
      ? [proposal.client.addressLine, proposal.client.city, proposal.client.state]
          .filter(Boolean)
          .join(", ") || null
      : null,
    serviceName: proposal.serviceType?.name ?? null,
    scopeText: proposal.scopeText,
    exclusionsText: proposal.exclusionsText,
    deadlineText: proposal.deadlineText,
    paymentTerms: proposal.paymentTerms,
    notes: proposal.notes ?? company.proposalFooterNotes,
    legalNotice: proposal.serviceType?.legalNotes ?? null,
    items: proposal.items.map((item) => ({
      description: item.description,
      detail: item.detail,
      unit: item.unit,
      quantity: item.quantity,
      unitPriceCents: item.unitPriceCents,
      totalCents: item.totalCents,
    })),
    subtotalCents: proposal.subtotalCents,
    discountCents: proposal.discountCents,
    totalCents: proposal.totalCents,
  };

  const buffer = await renderToBuffer(<ProposalDocument data={data} />);
  return Buffer.from(buffer);
}
