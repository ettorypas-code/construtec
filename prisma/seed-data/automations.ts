/**
 * Regras de automação instaladas por padrão.
 *
 * Cada regra é um par QUANDO → FAZER. As ações são guardadas como JSON para que
 * novas ações possam ser adicionadas sem migração de banco. O motor está em
 * src/lib/automation.
 */

export type AutomationActionSeed =
  | {
      type: "CRIAR_TAREFA";
      title: string;
      detail?: string;
      dueInDays: number;
      priority: "BAIXA" | "NORMAL" | "ALTA";
    }
  | { type: "NOTIFICAR"; title: string; body?: string };

export type AutomationRuleSeed = {
  name: string;
  trigger: string;
  actions: AutomationActionSeed[];
};

export const automationRules: AutomationRuleSeed[] = [
  {
    name: "Contatar novo lead no mesmo dia",
    trigger: "LEAD_CRIADO",
    actions: [
      {
        type: "CRIAR_TAREFA",
        title: "Entrar em contato",
        detail: "Primeiro contato com o lead recém-recebido.",
        dueInDays: 0,
        priority: "ALTA",
      },
    ],
  },
  {
    name: "Follow-up dois dias após enviar proposta",
    trigger: "PROPOSTA_ENVIADA",
    actions: [
      {
        type: "CRIAR_TAREFA",
        title: "Follow-up da proposta",
        detail: "Confirmar recebimento e tirar dúvidas.",
        dueInDays: 2,
        priority: "NORMAL",
      },
    ],
  },
  {
    name: "Organizar execução quando a proposta é aceita",
    trigger: "PROPOSTA_ACEITA",
    actions: [
      {
        type: "CRIAR_TAREFA",
        title: "Agendar execução do serviço",
        detail: "Combinar data com o cliente e lançar na agenda.",
        dueInDays: 1,
        priority: "ALTA",
      },
      { type: "NOTIFICAR", title: "Proposta aceita", body: "Um cliente aceitou a proposta." },
    ],
  },
  {
    name: "Gerar relatório após concluir vistoria",
    trigger: "VISTORIA_CONCLUIDA",
    actions: [
      {
        type: "CRIAR_TAREFA",
        title: "Gerar relatório da vistoria",
        detail: "Revisar as ocorrências e emitir o documento.",
        dueInDays: 0,
        priority: "ALTA",
      },
    ],
  },
  {
    name: "Enviar relatório ao cliente",
    trigger: "RELATORIO_GERADO",
    actions: [
      {
        type: "CRIAR_TAREFA",
        title: "Enviar relatório ao cliente",
        dueInDays: 0,
        priority: "ALTA",
      },
    ],
  },
  {
    name: "Avisar sobre pagamento vencido",
    trigger: "PAGAMENTO_VENCIDO",
    actions: [
      {
        type: "CRIAR_TAREFA",
        title: "Cobrar pagamento vencido",
        dueInDays: 0,
        priority: "ALTA",
      },
      { type: "NOTIFICAR", title: "Pagamento vencido", body: "Há um recebimento em atraso." },
    ],
  },
];
