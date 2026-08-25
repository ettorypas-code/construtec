/**
 * Rótulos pt-BR e tom visual de cada valor de enum.
 *
 * Um lugar só: o pipeline, os filtros, os PDFs e os selos leem daqui. Trocar o
 * texto de um status é editar uma linha, não caçar strings pela aplicação.
 */

import {
  AutomationTrigger,
  ChecklistItemStatus,
  ClientKind,
  ContactChannel,
  ContractStatus,
  CouncilType,
  DocumentKind,
  EventStatus,
  EventType,
  ExpenseCategory,
  ExpenseStatus,
  FindingCategory,
  FindingStatus,
  InspectionStatus,
  LeadSource,
  LeadStatus,
  PartnerKind,
  PaymentMethod,
  PaymentStatus,
  ProjectKind,
  ProjectStatus,
  PropertyKind,
  ProposalStatus,
  RatingScale,
  RestrictionLevel,
  ServiceCategory,
  Severity,
  StageStatus,
  TaskPriority,
  Unit,
  UserRole,
} from "./enums";

/** Paleta de selo. Mapeada para classes concretas em `components/ui/badge.tsx`. */
export type Tone =
  | "neutral"
  | "brand"
  | "success"
  | "warning"
  | "danger"
  | "critical"
  | "high"
  | "medium"
  | "low";

export type Option<T extends string> = { value: T; label: string };

/** Converte um mapa de rótulos em lista para `<select>`, na ordem declarada. */
export function toOptions<T extends string>(labels: Record<T, string>): Option<T>[] {
  return (Object.keys(labels) as T[]).map((value) => ({ value, label: labels[value] }));
}

/* -------------------------------------------------------------------------- */

export const userRoleLabels: Record<UserRole, string> = {
  ADMIN: "Administrador",
  CLIENT: "Cliente",
  ARCHITECT: "Arquiteto",
};

export const leadStatusLabels: Record<LeadStatus, string> = {
  NOVO: "Novo lead",
  CONTATO: "Contato realizado",
  QUALIFICADO: "Qualificado",
  ORCAMENTO_ENVIADO: "Orçamento enviado",
  NEGOCIACAO: "Negociação",
  FECHADO: "Fechado",
  EXECUCAO: "Execução",
  CONCLUIDO: "Concluído",
  POS_VENDA: "Pós-venda",
  PERDIDO: "Perdido",
};

export const leadStatusTones: Record<LeadStatus, Tone> = {
  NOVO: "brand",
  CONTATO: "neutral",
  QUALIFICADO: "neutral",
  ORCAMENTO_ENVIADO: "warning",
  NEGOCIACAO: "warning",
  FECHADO: "success",
  EXECUCAO: "brand",
  CONCLUIDO: "success",
  POS_VENDA: "neutral",
  PERDIDO: "danger",
};

export const leadSourceLabels: Record<LeadSource, string> = {
  SITE: "Site",
  INDICACAO: "Indicação",
  WHATSAPP: "WhatsApp",
  INSTAGRAM: "Instagram",
  GOOGLE: "Google",
  PARCEIRO: "Parceiro",
  OUTRO: "Outro",
};

export const contactChannelLabels: Record<ContactChannel, string> = {
  WHATSAPP: "WhatsApp",
  TELEFONE: "Telefone",
  EMAIL: "E-mail",
  PRESENCIAL: "Presencial",
  OUTRO: "Outro",
};

export const clientKindLabels: Record<ClientKind, string> = {
  PF: "Pessoa física",
  PJ: "Pessoa jurídica",
};

export const partnerKindLabels: Record<PartnerKind, string> = {
  ARQUITETO: "Arquiteto",
  EMPREITEIRO: "Empreiteiro",
  FORNECEDOR: "Fornecedor",
};

export const proposalStatusLabels: Record<ProposalStatus, string> = {
  RASCUNHO: "Rascunho",
  ENVIADA: "Enviada",
  VISUALIZADA: "Visualizada",
  ACEITA: "Aceita",
  RECUSADA: "Recusada",
  EXPIRADA: "Expirada",
};

export const proposalStatusTones: Record<ProposalStatus, Tone> = {
  RASCUNHO: "neutral",
  ENVIADA: "brand",
  VISUALIZADA: "warning",
  ACEITA: "success",
  RECUSADA: "danger",
  EXPIRADA: "neutral",
};

export const contractStatusLabels: Record<ContractStatus, string> = {
  RASCUNHO: "Rascunho",
  ENVIADO: "Enviado",
  ASSINADO: "Assinado",
  ENCERRADO: "Encerrado",
  CANCELADO: "Cancelado",
};

export const propertyKindLabels: Record<PropertyKind, string> = {
  APARTAMENTO: "Apartamento",
  CASA: "Casa",
  SALA_COMERCIAL: "Sala comercial",
  LOJA: "Loja",
  TERRENO: "Terreno",
  OUTRO: "Outro",
};

export const projectKindLabels: Record<ProjectKind, string> = {
  REFORMA: "Reforma",
  OBRA_NOVA: "Obra nova",
  INTERIORES: "Interiores",
  MANUTENCAO: "Manutenção",
  OUTRO: "Outro",
};

export const projectStatusLabels: Record<ProjectStatus, string> = {
  PLANEJAMENTO: "Planejamento",
  EM_ANDAMENTO: "Em andamento",
  PARALISADA: "Paralisada",
  CONCLUIDA: "Concluída",
  CANCELADA: "Cancelada",
};

export const projectStatusTones: Record<ProjectStatus, Tone> = {
  PLANEJAMENTO: "neutral",
  EM_ANDAMENTO: "brand",
  PARALISADA: "warning",
  CONCLUIDA: "success",
  CANCELADA: "danger",
};

export const stageStatusLabels: Record<StageStatus, string> = {
  NAO_INICIADA: "Não iniciada",
  EM_ANDAMENTO: "Em andamento",
  CONCLUIDA: "Concluída",
  APROVADA: "Aprovada",
  REPROVADA: "Reprovada",
};

export const inspectionStatusLabels: Record<InspectionStatus, string> = {
  AGENDADA: "Agendada",
  EM_ANDAMENTO: "Em andamento",
  CONCLUIDA: "Concluída",
  CANCELADA: "Cancelada",
};

export const inspectionStatusTones: Record<InspectionStatus, Tone> = {
  AGENDADA: "neutral",
  EM_ANDAMENTO: "brand",
  CONCLUIDA: "success",
  CANCELADA: "danger",
};

export const severityLabels: Record<Severity, string> = {
  CRITICA: "Crítica",
  ALTA: "Alta",
  MEDIA: "Média",
  BAIXA: "Baixa",
};

export const severityTones: Record<Severity, Tone> = {
  CRITICA: "critical",
  ALTA: "high",
  MEDIA: "medium",
  BAIXA: "low",
};

/** Explica ao usuário o critério de cada gravidade, no momento de classificar. */
export const severityHints: Record<Severity, string> = {
  CRITICA: "Impede o uso, risco à segurança ou infiltração ativa",
  ALTA: "Compromete o funcionamento ou tende a piorar",
  MEDIA: "Acabamento fora do padrão, sem risco imediato",
  BAIXA: "Detalhe estético, correção simples",
};

export const findingStatusLabels: Record<FindingStatus, string> = {
  PENDENTE: "Pendente",
  CORRIGIDO: "Corrigido",
  REPROVADO: "Reprovado",
};

export const findingStatusTones: Record<FindingStatus, Tone> = {
  PENDENTE: "warning",
  CORRIGIDO: "success",
  REPROVADO: "danger",
};

export const checklistItemStatusLabels: Record<ChecklistItemStatus, string> = {
  PENDENTE: "Não avaliado",
  OK: "Conforme",
  NAO_CONFORME: "Não conforme",
  NOVO: "Novo",
  BOM: "Bom estado",
  REGULAR: "Estado regular",
  RUIM: "Mau estado",
  PESSIMO: "Péssimo estado",
  CORRIGIDO: "Corrigido",
  CORRIGIDO_PARCIAL: "Corrigido em parte",
  NAO_CORRIGIDO: "Não corrigido",
  NAO_APLICAVEL: "Não se aplica",
};

/** Abreviação para o botão. O rótulo completo vai no `aria-label` e na legenda. */
export const checklistItemStatusShort: Record<ChecklistItemStatus, string> = {
  PENDENTE: "—",
  OK: "OK",
  NAO_CONFORME: "NC",
  NOVO: "Novo",
  BOM: "Bom",
  REGULAR: "Reg.",
  RUIM: "Ruim",
  PESSIMO: "Péss.",
  CORRIGIDO: "OK",
  CORRIGIDO_PARCIAL: "Parcial",
  NAO_CORRIGIDO: "Não",
  NAO_APLICAVEL: "N/A",
};

export const checklistItemStatusTones: Record<ChecklistItemStatus, Tone> = {
  PENDENTE: "neutral",
  OK: "success",
  NAO_CONFORME: "danger",
  NOVO: "success",
  BOM: "brand",
  REGULAR: "medium",
  RUIM: "high",
  PESSIMO: "critical",
  CORRIGIDO: "success",
  CORRIGIDO_PARCIAL: "medium",
  NAO_CORRIGIDO: "critical",
  NAO_APLICAVEL: "neutral",
};

export const ratingScaleLabels: Record<RatingScale, string> = {
  CONFORMIDADE: "Conformidade (imóvel novo)",
  ESTADO: "Estado de conservação (5 níveis)",
  CORRECAO: "Conferência de correção (revistoria)",
};

export const ratingScaleHints: Record<RatingScale, string> = {
  CONFORMIDADE:
    "Para entrega de imóvel novo: o item foi entregue como deveria, ou é não conformidade.",
  ESTADO:
    "Para locação e cautelar: registra o desgaste de Novo a Péssimo, para comparar depois.",
  CORRECAO:
    "Para revistoria: confere se cada apontamento anterior foi resolvido, resolvido pela metade ou continua igual.",
};

export const findingCategoryLabels: Record<FindingCategory, string> = {
  PINTURA: "Pintura",
  ALVENARIA: "Alvenaria",
  REVESTIMENTO: "Revestimento",
  PISO: "Piso",
  ESQUADRIA: "Esquadria",
  VIDRO: "Vidro",
  PORTA: "Porta",
  HIDRAULICA: "Hidráulica",
  ELETRICA: "Elétrica",
  GAS: "Gás",
  LOUCA_METAL: "Louças e metais",
  MARCENARIA: "Marcenaria",
  IMPERMEABILIZACAO: "Impermeabilização",
  FORRO_GESSO: "Forro e gesso",
  ESTRUTURA: "Estrutura",
  LIMPEZA: "Limpeza",
  ACABAMENTO: "Acabamento geral",
  OUTRO: "Outro",
};

export const documentKindLabels: Record<DocumentKind, string> = {
  RELATORIO_VISTORIA: "Relatório de vistoria",
  RELATORIO_FOTOGRAFICO: "Relatório fotográfico",
  CHECKLIST_ENTREGA: "Checklist de entrega",
  RELATORIO_NAO_CONFORMIDADES: "Relatório de não conformidades",
  RELATORIO_VISITA: "Relatório de visita",
  RELATORIO_ACOMPANHAMENTO: "Relatório de acompanhamento",
  LAUDO_TECNICO: "Laudo técnico",
  PARECER_TECNICO: "Parecer técnico",
  INSPECAO_PREDIAL: "Laudo de inspeção predial",
};

export const restrictionLevelLabels: Record<RestrictionLevel, string> = {
  LIVRE: "Livre",
  REQUER_HABILITACAO: "Requer responsável técnico",
  RESTRITO: "Restrito",
};

export const restrictionLevelTones: Record<RestrictionLevel, Tone> = {
  LIVRE: "success",
  REQUER_HABILITACAO: "warning",
  RESTRITO: "danger",
};

export const councilTypeLabels: Record<CouncilType, string> = {
  NENHUM: "Sem registro em conselho",
  CREA: "CREA",
  CAU: "CAU",
  CFT: "CFT",
};

export const serviceCategoryLabels: Record<ServiceCategory, string> = {
  VISTORIA: "Vistoria",
  ORCAMENTO: "Orçamento",
  FISCALIZACAO: "Fiscalização",
  GERENCIAMENTO: "Gerenciamento",
  TECNICO: "Técnico",
};

export const eventTypeLabels: Record<EventType, string> = {
  VISTORIA: "Vistoria",
  VISITA: "Visita",
  REUNIAO: "Reunião",
  ENTREGA_RELATORIO: "Entrega de relatório",
  FOLLOW_UP: "Follow-up",
  PAGAMENTO: "Pagamento",
  PRAZO: "Prazo",
};

export const eventTypeTones: Record<EventType, Tone> = {
  VISTORIA: "brand",
  VISITA: "brand",
  REUNIAO: "neutral",
  ENTREGA_RELATORIO: "success",
  FOLLOW_UP: "warning",
  PAGAMENTO: "success",
  PRAZO: "danger",
};

export const eventStatusLabels: Record<EventStatus, string> = {
  AGENDADO: "Agendado",
  CONFIRMADO: "Confirmado",
  REALIZADO: "Realizado",
  CANCELADO: "Cancelado",
};

export const taskPriorityLabels: Record<TaskPriority, string> = {
  BAIXA: "Baixa",
  NORMAL: "Normal",
  ALTA: "Alta",
};

export const taskPriorityTones: Record<TaskPriority, Tone> = {
  BAIXA: "neutral",
  NORMAL: "brand",
  ALTA: "danger",
};

export const paymentStatusLabels: Record<PaymentStatus, string> = {
  PREVISTO: "Previsto",
  RECEBIDO: "Recebido",
  CANCELADO: "Cancelado",
};

export const expenseStatusLabels: Record<ExpenseStatus, string> = {
  PREVISTA: "Prevista",
  PAGA: "Paga",
  CANCELADA: "Cancelada",
};

export const paymentMethodLabels: Record<PaymentMethod, string> = {
  PIX: "Pix",
  TRANSFERENCIA: "Transferência",
  DINHEIRO: "Dinheiro",
  CARTAO: "Cartão",
  BOLETO: "Boleto",
  OUTRO: "Outro",
};

export const expenseCategoryLabels: Record<ExpenseCategory, string> = {
  TRANSPORTE: "Transporte",
  FERRAMENTAS: "Ferramentas",
  SOFTWARE: "Software",
  MARKETING: "Marketing",
  IMPOSTOS: "Impostos",
  TERCEIRIZADO: "Terceirizado",
  MATERIAL: "Material",
  ADMINISTRATIVO: "Administrativo",
  OUTRO: "Outro",
};

export const unitLabels: Record<Unit, string> = {
  UN: "un",
  M: "m",
  M2: "m²",
  M3: "m³",
  KG: "kg",
  PT: "pt",
  VB: "vb",
  H: "h",
  DIA: "dia",
  SC: "sc",
  L: "L",
  CJ: "cj",
};

export const unitDescriptions: Record<Unit, string> = {
  UN: "Unidade",
  M: "Metro linear",
  M2: "Metro quadrado",
  M3: "Metro cúbico",
  KG: "Quilograma",
  PT: "Ponto",
  VB: "Verba",
  H: "Hora",
  DIA: "Diária",
  SC: "Saco",
  L: "Litro",
  CJ: "Conjunto",
};

export const automationTriggerLabels: Record<AutomationTrigger, string> = {
  LEAD_CRIADO: "Lead criado",
  PROPOSTA_ENVIADA: "Proposta enviada",
  PROPOSTA_ACEITA: "Proposta aceita",
  VISTORIA_CONCLUIDA: "Vistoria concluída",
  RELATORIO_GERADO: "Relatório gerado",
  PAGAMENTO_VENCIDO: "Pagamento vencido",
};
