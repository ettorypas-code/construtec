/**
 * Vocabulário do domínio.
 *
 * Os enums vivem aqui como `as const` e o banco guarda `String` — não usamos
 * `enum` nativo do Prisma. Isso mantém o mesmo schema em SQLite (dev) e
 * PostgreSQL (produção) e permite renomear um rótulo sem migração.
 * Ver ARQUITETURA.md, decisão D2.
 *
 * Este módulo não importa nada e não faz I/O.
 */

export const UserRole = {
  ADMIN: "ADMIN",
  CLIENT: "CLIENT",
  ARCHITECT: "ARCHITECT",
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

/* -------------------------------------------------------------------------- */
/*  Comercial                                                                  */
/* -------------------------------------------------------------------------- */

/** Ordem do array é a ordem das colunas do pipeline. PERDIDO fica fora dele. */
export const LeadStatus = {
  NOVO: "NOVO",
  CONTATO: "CONTATO",
  QUALIFICADO: "QUALIFICADO",
  ORCAMENTO_ENVIADO: "ORCAMENTO_ENVIADO",
  NEGOCIACAO: "NEGOCIACAO",
  FECHADO: "FECHADO",
  EXECUCAO: "EXECUCAO",
  CONCLUIDO: "CONCLUIDO",
  POS_VENDA: "POS_VENDA",
  PERDIDO: "PERDIDO",
} as const;
export type LeadStatus = (typeof LeadStatus)[keyof typeof LeadStatus];

export const PIPELINE_STAGES: readonly LeadStatus[] = [
  LeadStatus.NOVO,
  LeadStatus.CONTATO,
  LeadStatus.QUALIFICADO,
  LeadStatus.ORCAMENTO_ENVIADO,
  LeadStatus.NEGOCIACAO,
  LeadStatus.FECHADO,
  LeadStatus.EXECUCAO,
  LeadStatus.CONCLUIDO,
  LeadStatus.POS_VENDA,
];

/** Estágios que contam como venda ganha, para taxa de conversão. */
export const WON_STAGES: readonly LeadStatus[] = [
  LeadStatus.FECHADO,
  LeadStatus.EXECUCAO,
  LeadStatus.CONCLUIDO,
  LeadStatus.POS_VENDA,
];

export const LeadSource = {
  SITE: "SITE",
  INDICACAO: "INDICACAO",
  WHATSAPP: "WHATSAPP",
  INSTAGRAM: "INSTAGRAM",
  GOOGLE: "GOOGLE",
  PARCEIRO: "PARCEIRO",
  OUTRO: "OUTRO",
} as const;
export type LeadSource = (typeof LeadSource)[keyof typeof LeadSource];

export const ContactChannel = {
  WHATSAPP: "WHATSAPP",
  TELEFONE: "TELEFONE",
  EMAIL: "EMAIL",
  PRESENCIAL: "PRESENCIAL",
  OUTRO: "OUTRO",
} as const;
export type ContactChannel = (typeof ContactChannel)[keyof typeof ContactChannel];

export const ClientKind = {
  PF: "PF",
  PJ: "PJ",
} as const;
export type ClientKind = (typeof ClientKind)[keyof typeof ClientKind];

export const PartnerKind = {
  ARQUITETO: "ARQUITETO",
  EMPREITEIRO: "EMPREITEIRO",
  FORNECEDOR: "FORNECEDOR",
} as const;
export type PartnerKind = (typeof PartnerKind)[keyof typeof PartnerKind];

export const ProposalStatus = {
  RASCUNHO: "RASCUNHO",
  ENVIADA: "ENVIADA",
  VISUALIZADA: "VISUALIZADA",
  ACEITA: "ACEITA",
  RECUSADA: "RECUSADA",
  EXPIRADA: "EXPIRADA",
} as const;
export type ProposalStatus = (typeof ProposalStatus)[keyof typeof ProposalStatus];

export const ContractStatus = {
  RASCUNHO: "RASCUNHO",
  ENVIADO: "ENVIADO",
  ASSINADO: "ASSINADO",
  ENCERRADO: "ENCERRADO",
  CANCELADO: "CANCELADO",
} as const;
export type ContractStatus = (typeof ContractStatus)[keyof typeof ContractStatus];

/* -------------------------------------------------------------------------- */
/*  Imóvel, obra e execução                                                    */
/* -------------------------------------------------------------------------- */

export const PropertyKind = {
  APARTAMENTO: "APARTAMENTO",
  CASA: "CASA",
  SALA_COMERCIAL: "SALA_COMERCIAL",
  LOJA: "LOJA",
  TERRENO: "TERRENO",
  OUTRO: "OUTRO",
} as const;
export type PropertyKind = (typeof PropertyKind)[keyof typeof PropertyKind];

export const ProjectKind = {
  REFORMA: "REFORMA",
  OBRA_NOVA: "OBRA_NOVA",
  INTERIORES: "INTERIORES",
  MANUTENCAO: "MANUTENCAO",
  OUTRO: "OUTRO",
} as const;
export type ProjectKind = (typeof ProjectKind)[keyof typeof ProjectKind];

export const ProjectStatus = {
  PLANEJAMENTO: "PLANEJAMENTO",
  EM_ANDAMENTO: "EM_ANDAMENTO",
  PARALISADA: "PARALISADA",
  CONCLUIDA: "CONCLUIDA",
  CANCELADA: "CANCELADA",
} as const;
export type ProjectStatus = (typeof ProjectStatus)[keyof typeof ProjectStatus];

export const StageStatus = {
  NAO_INICIADA: "NAO_INICIADA",
  EM_ANDAMENTO: "EM_ANDAMENTO",
  CONCLUIDA: "CONCLUIDA",
  APROVADA: "APROVADA",
  REPROVADA: "REPROVADA",
} as const;
export type StageStatus = (typeof StageStatus)[keyof typeof StageStatus];

export const InspectionStatus = {
  AGENDADA: "AGENDADA",
  EM_ANDAMENTO: "EM_ANDAMENTO",
  CONCLUIDA: "CONCLUIDA",
  CANCELADA: "CANCELADA",
} as const;
export type InspectionStatus = (typeof InspectionStatus)[keyof typeof InspectionStatus];

export const Severity = {
  CRITICA: "CRITICA",
  ALTA: "ALTA",
  MEDIA: "MEDIA",
  BAIXA: "BAIXA",
} as const;
export type Severity = (typeof Severity)[keyof typeof Severity];

export const SEVERITY_ORDER: readonly Severity[] = [
  Severity.CRITICA,
  Severity.ALTA,
  Severity.MEDIA,
  Severity.BAIXA,
];

export const FindingStatus = {
  PENDENTE: "PENDENTE",
  CORRIGIDO: "CORRIGIDO",
  REPROVADO: "REPROVADO",
} as const;
export type FindingStatus = (typeof FindingStatus)[keyof typeof FindingStatus];

/**
 * Avaliação de um item do checklist.
 *
 * Existem duas escalas porque são duas perguntas diferentes:
 *
 *  - CONFORMIDADE responde "foi entregue como deveria?". É a pergunta da
 *    entrega de imóvel novo, onde não existe meio-termo: ou está aceitável ou é
 *    não conformidade a ser corrigida pela construtora.
 *  - ESTADO responde "em que estado está?". É a pergunta da vistoria de
 *    locação e da cautelar, onde o imóvel tem uso e o que importa é registrar
 *    o desgaste para comparar depois.
 *
 * Ambas convivem no mesmo campo `status`. Qual delas vale é decidido pelo
 * modelo de checklist e congelado na vistoria no momento da criação.
 */
export const ChecklistItemStatus = {
  PENDENTE: "PENDENTE",

  // Escala de conformidade
  OK: "OK",
  NAO_CONFORME: "NAO_CONFORME",

  // Escala de estado de conservação
  NOVO: "NOVO",
  BOM: "BOM",
  REGULAR: "REGULAR",
  RUIM: "RUIM",
  PESSIMO: "PESSIMO",

  // Comum às duas
  NAO_APLICAVEL: "NAO_APLICAVEL",
} as const;
export type ChecklistItemStatus = (typeof ChecklistItemStatus)[keyof typeof ChecklistItemStatus];

export const RatingScale = {
  CONFORMIDADE: "CONFORMIDADE",
  ESTADO: "ESTADO",
} as const;
export type RatingScale = (typeof RatingScale)[keyof typeof RatingScale];

/** Valores selecionáveis de cada escala, na ordem em que aparecem na tela. */
export const RATING_SCALE_VALUES: Record<RatingScale, readonly ChecklistItemStatus[]> = {
  CONFORMIDADE: [
    ChecklistItemStatus.OK,
    ChecklistItemStatus.NAO_CONFORME,
    ChecklistItemStatus.NAO_APLICAVEL,
  ],
  ESTADO: [
    ChecklistItemStatus.NOVO,
    ChecklistItemStatus.BOM,
    ChecklistItemStatus.REGULAR,
    ChecklistItemStatus.RUIM,
    ChecklistItemStatus.PESSIMO,
    ChecklistItemStatus.NAO_APLICAVEL,
  ],
};

/**
 * Avaliações que caracterizam problema.
 *
 * Serve para o contador de pendências e para o relatório: um item em estado
 * ruim ou péssimo entra no resumo do mesmo jeito que uma não conformidade.
 */
export const PROBLEM_STATUSES: readonly ChecklistItemStatus[] = [
  ChecklistItemStatus.NAO_CONFORME,
  ChecklistItemStatus.RUIM,
  ChecklistItemStatus.PESSIMO,
];

export function isProblemStatus(status: string): boolean {
  return (PROBLEM_STATUSES as readonly string[]).includes(status);
}

export const FindingCategory = {
  PINTURA: "PINTURA",
  ALVENARIA: "ALVENARIA",
  REVESTIMENTO: "REVESTIMENTO",
  PISO: "PISO",
  ESQUADRIA: "ESQUADRIA",
  VIDRO: "VIDRO",
  PORTA: "PORTA",
  HIDRAULICA: "HIDRAULICA",
  ELETRICA: "ELETRICA",
  GAS: "GAS",
  LOUCA_METAL: "LOUCA_METAL",
  MARCENARIA: "MARCENARIA",
  IMPERMEABILIZACAO: "IMPERMEABILIZACAO",
  FORRO_GESSO: "FORRO_GESSO",
  ESTRUTURA: "ESTRUTURA",
  LIMPEZA: "LIMPEZA",
  ACABAMENTO: "ACABAMENTO",
  OUTRO: "OUTRO",
} as const;
export type FindingCategory = (typeof FindingCategory)[keyof typeof FindingCategory];

/* -------------------------------------------------------------------------- */
/*  Documentos e conformidade legal                                            */
/* -------------------------------------------------------------------------- */

/**
 * Tipo de documento gerado. A separação abaixo é a espinha dorsal da guarda de
 * terminologia: os itens de `RESTRICTED_DOCUMENT_KINDS` só podem ser emitidos
 * quando existe responsável técnico habilitado configurado.
 * Ver `lib/compliance/`.
 */
export const DocumentKind = {
  RELATORIO_VISTORIA: "RELATORIO_VISTORIA",
  RELATORIO_FOTOGRAFICO: "RELATORIO_FOTOGRAFICO",
  CHECKLIST_ENTREGA: "CHECKLIST_ENTREGA",
  RELATORIO_NAO_CONFORMIDADES: "RELATORIO_NAO_CONFORMIDADES",
  RELATORIO_VISITA: "RELATORIO_VISITA",
  RELATORIO_ACOMPANHAMENTO: "RELATORIO_ACOMPANHAMENTO",
  LAUDO_TECNICO: "LAUDO_TECNICO",
  PARECER_TECNICO: "PARECER_TECNICO",
  INSPECAO_PREDIAL: "INSPECAO_PREDIAL",
} as const;
export type DocumentKind = (typeof DocumentKind)[keyof typeof DocumentKind];

/** Documentos que exigem profissional habilitado com registro em conselho. */
export const RESTRICTED_DOCUMENT_KINDS: readonly DocumentKind[] = [
  DocumentKind.LAUDO_TECNICO,
  DocumentKind.PARECER_TECNICO,
  DocumentKind.INSPECAO_PREDIAL,
];

export const RestrictionLevel = {
  /** Posso prestar e documentar livremente. */
  LIVRE: "LIVRE",
  /** Posso prestar, mas o documento formal exige responsável técnico. */
  REQUER_HABILITACAO: "REQUER_HABILITACAO",
  /** Não posso prestar sem registro profissional próprio. */
  RESTRITO: "RESTRITO",
} as const;
export type RestrictionLevel = (typeof RestrictionLevel)[keyof typeof RestrictionLevel];

export const CouncilType = {
  NENHUM: "NENHUM",
  CREA: "CREA",
  CAU: "CAU",
  CFT: "CFT",
} as const;
export type CouncilType = (typeof CouncilType)[keyof typeof CouncilType];

export const ReportStatus = {
  RASCUNHO: "RASCUNHO",
  GERADO: "GERADO",
  ENVIADO: "ENVIADO",
} as const;
export type ReportStatus = (typeof ReportStatus)[keyof typeof ReportStatus];

export const ServiceCategory = {
  VISTORIA: "VISTORIA",
  ORCAMENTO: "ORCAMENTO",
  FISCALIZACAO: "FISCALIZACAO",
  GERENCIAMENTO: "GERENCIAMENTO",
  TECNICO: "TECNICO",
} as const;
export type ServiceCategory = (typeof ServiceCategory)[keyof typeof ServiceCategory];

/* -------------------------------------------------------------------------- */
/*  Agenda, tarefas e finanças                                                 */
/* -------------------------------------------------------------------------- */

export const EventType = {
  VISTORIA: "VISTORIA",
  VISITA: "VISITA",
  REUNIAO: "REUNIAO",
  ENTREGA_RELATORIO: "ENTREGA_RELATORIO",
  FOLLOW_UP: "FOLLOW_UP",
  PAGAMENTO: "PAGAMENTO",
  PRAZO: "PRAZO",
} as const;
export type EventType = (typeof EventType)[keyof typeof EventType];

export const EventStatus = {
  AGENDADO: "AGENDADO",
  CONFIRMADO: "CONFIRMADO",
  REALIZADO: "REALIZADO",
  CANCELADO: "CANCELADO",
} as const;
export type EventStatus = (typeof EventStatus)[keyof typeof EventStatus];

export const TaskPriority = {
  BAIXA: "BAIXA",
  NORMAL: "NORMAL",
  ALTA: "ALTA",
} as const;
export type TaskPriority = (typeof TaskPriority)[keyof typeof TaskPriority];

export const PaymentStatus = {
  PREVISTO: "PREVISTO",
  RECEBIDO: "RECEBIDO",
  CANCELADO: "CANCELADO",
} as const;
export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

export const ExpenseStatus = {
  PREVISTA: "PREVISTA",
  PAGA: "PAGA",
  CANCELADA: "CANCELADA",
} as const;
export type ExpenseStatus = (typeof ExpenseStatus)[keyof typeof ExpenseStatus];

export const PaymentMethod = {
  PIX: "PIX",
  TRANSFERENCIA: "TRANSFERENCIA",
  DINHEIRO: "DINHEIRO",
  CARTAO: "CARTAO",
  BOLETO: "BOLETO",
  OUTRO: "OUTRO",
} as const;
export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod];

export const ExpenseCategory = {
  TRANSPORTE: "TRANSPORTE",
  FERRAMENTAS: "FERRAMENTAS",
  SOFTWARE: "SOFTWARE",
  MARKETING: "MARKETING",
  IMPOSTOS: "IMPOSTOS",
  TERCEIRIZADO: "TERCEIRIZADO",
  MATERIAL: "MATERIAL",
  ADMINISTRATIVO: "ADMINISTRATIVO",
  OUTRO: "OUTRO",
} as const;
export type ExpenseCategory = (typeof ExpenseCategory)[keyof typeof ExpenseCategory];

/* -------------------------------------------------------------------------- */
/*  Orçamento                                                                  */
/* -------------------------------------------------------------------------- */

export const Unit = {
  UN: "UN",
  M: "M",
  M2: "M2",
  M3: "M3",
  KG: "KG",
  PT: "PT",
  VB: "VB",
  H: "H",
  DIA: "DIA",
  SC: "SC",
  L: "L",
  CJ: "CJ",
} as const;
export type Unit = (typeof Unit)[keyof typeof Unit];

export const BudgetStatus = {
  RASCUNHO: "RASCUNHO",
  FECHADO: "FECHADO",
  CONVERTIDO: "CONVERTIDO",
} as const;
export type BudgetStatus = (typeof BudgetStatus)[keyof typeof BudgetStatus];

/* -------------------------------------------------------------------------- */
/*  Plataforma: automações e IA                                                */
/* -------------------------------------------------------------------------- */

export const AutomationTrigger = {
  LEAD_CRIADO: "LEAD_CRIADO",
  PROPOSTA_ENVIADA: "PROPOSTA_ENVIADA",
  PROPOSTA_ACEITA: "PROPOSTA_ACEITA",
  VISTORIA_CONCLUIDA: "VISTORIA_CONCLUIDA",
  RELATORIO_GERADO: "RELATORIO_GERADO",
  PAGAMENTO_VENCIDO: "PAGAMENTO_VENCIDO",
} as const;
export type AutomationTrigger = (typeof AutomationTrigger)[keyof typeof AutomationTrigger];

export const AutomationActionType = {
  CRIAR_TAREFA: "CRIAR_TAREFA",
  CRIAR_EVENTO: "CRIAR_EVENTO",
  NOTIFICAR: "NOTIFICAR",
  GERAR_RELATORIO: "GERAR_RELATORIO",
} as const;
export type AutomationActionType =
  (typeof AutomationActionType)[keyof typeof AutomationActionType];

export const AIInteractionKind = {
  SUGERIR_SERVICO: "SUGERIR_SERVICO",
  ANALISAR_FOTO: "ANALISAR_FOTO",
  REDIGIR_OCORRENCIA: "REDIGIR_OCORRENCIA",
  REDIGIR_ESCOPO: "REDIGIR_ESCOPO",
  SUGERIR_FOLLOW_UP: "SUGERIR_FOLLOW_UP",
  RESUMIR_RELATORIO: "RESUMIR_RELATORIO",
} as const;
export type AIInteractionKind = (typeof AIInteractionKind)[keyof typeof AIInteractionKind];

export const MediaKind = {
  FOTO: "FOTO",
  VIDEO: "VIDEO",
  DOCUMENTO: "DOCUMENTO",
} as const;
export type MediaKind = (typeof MediaKind)[keyof typeof MediaKind];
