/**
 * Eventos de domínio que o motor de automações escuta.
 *
 * O tipo é uma união discriminada de propósito: adicionar um gatilho novo passa
 * a ser um erro de compilação em todo lugar que precisa tratá-lo, em vez de uma
 * string solta que silenciosamente não dispara nada.
 */

export type DomainEvent =
  | {
      type: "LEAD_CRIADO";
      leadId: string;
      leadName: string;
    }
  | {
      type: "PROPOSTA_ENVIADA";
      proposalId: string;
      proposalNumber: string;
      clientName: string;
    }
  | {
      type: "PROPOSTA_ACEITA";
      proposalId: string;
      proposalNumber: string;
      clientName: string;
    }
  | {
      type: "VISTORIA_CONCLUIDA";
      inspectionId: string;
      inspectionTitle: string;
    }
  | {
      type: "RELATORIO_GERADO";
      reportId: string;
      reportTitle: string;
      inspectionId: string | null;
    }
  | {
      type: "PAGAMENTO_VENCIDO";
      paymentId: string;
      description: string;
    };

export type DomainEventType = DomainEvent["type"];

/** Entidade a que a automação deve amarrar as tarefas e notificações criadas. */
export function eventSubject(event: DomainEvent): {
  entityType: string;
  entityId: string;
  label: string;
  link: string;
} {
  switch (event.type) {
    case "LEAD_CRIADO":
      return {
        entityType: "Lead",
        entityId: event.leadId,
        label: event.leadName,
        link: `/crm/${event.leadId}`,
      };
    case "PROPOSTA_ENVIADA":
    case "PROPOSTA_ACEITA":
      return {
        entityType: "Proposal",
        entityId: event.proposalId,
        label: `${event.proposalNumber} — ${event.clientName}`,
        link: `/propostas/${event.proposalId}`,
      };
    case "VISTORIA_CONCLUIDA":
      return {
        entityType: "Inspection",
        entityId: event.inspectionId,
        label: event.inspectionTitle,
        link: `/vistorias/${event.inspectionId}`,
      };
    case "RELATORIO_GERADO":
      return {
        entityType: "Report",
        entityId: event.reportId,
        label: event.reportTitle,
        link: event.inspectionId ? `/vistorias/${event.inspectionId}` : "/vistorias",
      };
    case "PAGAMENTO_VENCIDO":
      return {
        entityType: "Payment",
        entityId: event.paymentId,
        label: event.description,
        link: "/financeiro",
      };
  }
}
