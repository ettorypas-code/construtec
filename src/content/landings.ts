/**
 * Conteúdo das landing pages.
 *
 * Texto separado de layout: quatro páginas com a mesma estrutura e conteúdos
 * diferentes são dados, não quatro componentes. Ajustar uma promessa comercial
 * passa a ser editar uma string, sem tocar em JSX.
 *
 * O campo `legalNote` é obrigatório nas páginas de serviço: nenhuma landing
 * promete documento que dependa de habilitação profissional sem dizer isso.
 */

export type LandingContent = {
  slug: string;
  serviceCode: string;
  seoTitle: string;
  seoDescription: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  formTitle: string;
  ctaLabel: string;
  problemsTitle: string;
  problemsIntro?: string;
  problems: string[];
  stepsTitle: string;
  steps: Array<{ title: string; description: string }>;
  includedTitle: string;
  includedIntro?: string;
  included: string[];
  faq: Array<{ question: string; answer: string }>;
  legalNote: string;
  closingTitle: string;
  closingSubtitle: string;
};

export const landings: LandingContent[] = [
  {
    slug: "vistoria-de-entrega",
    serviceCode: "VIST-ENTREGA",
    seoTitle: "Vistoria de entrega de chaves — apartamento novo",
    seoDescription:
      "Acompanhamento técnico na entrega do seu imóvel novo, com checklist por ambiente, registro fotográfico e relatório para apresentar à construtora.",
    eyebrow: "Vistoria de entrega de chaves",
    title: "Você comprou um imóvel novo? Não aceite as chaves sem saber o que está recebendo.",
    subtitle:
      "Acompanho a entrega com você, item por item, e registro tudo o que está fora do padrão. " +
      "Você sai da vistoria com um relatório organizado para exigir as correções.",
    formTitle: "Agendar vistoria",
    ctaLabel: "Agendar vistoria",
    problemsTitle: "O que costuma dar errado na entrega",
    problemsIntro:
      "A vistoria de entrega é o único momento em que você tem força para exigir correção sem discussão.",
    problems: [
      "Defeitos passam despercebidos porque o comprador não sabe onde olhar nem o que testar.",
      "A construtora registra a entrega antes das correções, e depois o problema vira seu.",
      "Falhas de caimento, vazamento e som cavo só aparecem em teste — não a olho nu.",
      "Sem registro fotográfico datado, a cobrança de correção vira palavra contra palavra.",
    ],
    stepsTitle: "Como funciona",
    steps: [
      { title: "Agende", description: "Me diga o empreendimento, a unidade e a data da entrega." },
      { title: "Vistoriamos juntos", description: "Percorremos ambiente por ambiente com checklist." },
      { title: "Identificamos", description: "Cada problema é fotografado, descrito e classificado." },
      { title: "Você recebe", description: "Relatório em PDF, organizado por ambiente e gravidade." },
      { title: "Você exige", description: "Usa o documento para solicitar as correções." },
    ],
    includedTitle: "O que está incluído",
    included: [
      "Checklist completo por ambiente: piso, revestimento, esquadrias, portas e acabamento",
      "Teste dos pontos hidráulicos e verificação de vazamento aparente",
      "Teste de tomadas, interruptores e pontos de iluminação",
      "Verificação de caimento de piso em áreas molhadas",
      "Conferência de prumo, planeza e alinhamento",
      "Registro fotográfico de cada não conformidade",
      "Classificação por gravidade: crítica, alta, média e baixa",
      "Relatório em PDF entregue em até 3 dias úteis",
    ],
    faq: [
      {
        question: "Quanto tempo dura a vistoria?",
        answer:
          "Entre duas e quatro horas, dependendo da metragem e da quantidade de ambientes. " +
          "Um apartamento de dois dormitórios costuma levar cerca de três horas.",
      },
      {
        question: "Preciso estar presente?",
        answer:
          "É recomendado, mas não obrigatório. Se você não puder ir, faço a vistoria e envio o " +
          "relatório. Com você presente, consigo explicar cada apontamento na hora.",
      },
      {
        question: "A construtora é obrigada a corrigir?",
        answer:
          "O relatório organiza e comprova o que foi encontrado na data da entrega. Ele é a base " +
          "da sua solicitação de correção junto à construtora. A negociação continua sendo entre " +
          "você e ela.",
      },
      {
        question: "E se eu já recebi as chaves?",
        answer:
          "Ainda vale. Imóveis novos têm prazos legais de garantia por tipo de problema, e um " +
          "registro organizado ajuda na solicitação. Quanto antes, melhor.",
      },
      {
        question: "Qual o valor?",
        answer:
          "A partir de R$ 450 para apartamentos de até 80 m². Acima disso, o valor é calculado " +
          "por metragem. Envie os dados do imóvel que eu confirmo antes de agendar.",
      },
    ],
    legalNote:
      "O serviço é de acompanhamento e registro documental. O documento entregue é um relatório " +
      "de vistoria com registro fotográfico, sem caráter de laudo técnico pericial. Não substitui " +
      "perícia judicial nem inspeção predial normatizada, que exigem profissional habilitado com " +
      "registro em conselho de classe e ART/RRT.",
    closingTitle: "A vistoria custa menos que o primeiro reparo",
    closingSubtitle:
      "Um vazamento não identificado na entrega vira obra depois — paga por você.",
  },

  {
    slug: "fiscalizacao-de-reforma",
    serviceCode: "FISC-REFORMA",
    seoTitle: "Fiscalização e acompanhamento de reforma",
    seoDescription:
      "Visitas periódicas à sua reforma com conferência do serviço executado, medição de avanço, registro de pendências e relatório para liberar pagamento.",
    eyebrow: "Fiscalização de reforma",
    title: "Sua reforma precisa de alguém que saiba o que perguntar ao pedreiro.",
    subtitle:
      "Acompanho a execução com visitas programadas, confiro o que foi feito contra o que foi " +
      "contratado e registro as pendências. Você libera pagamento sabendo o que está pagando.",
    formTitle: "Falar sobre minha reforma",
    ctaLabel: "Quero acompanhamento",
    problemsTitle: "Por que reforma sai do controle",
    problems: [
      "O serviço avança sem ninguém conferir se foi executado como combinado.",
      "O pagamento é liberado por etapa concluída — mas ninguém mede o que foi concluído.",
      "Pendências são combinadas verbalmente e esquecidas até virar retrabalho.",
      "Sem cronograma acompanhado, o atraso só aparece quando já é grande demais.",
    ],
    stepsTitle: "Como funciona",
    steps: [
      { title: "Mapeamos", description: "Cadastro das etapas, valores e prazos combinados." },
      { title: "Visito a obra", description: "Visitas programadas ao longo do mês." },
      { title: "Confiro", description: "Serviço executado contra o contratado, com fotos." },
      { title: "Meço", description: "Percentual real de avanço por etapa." },
      { title: "Relato", description: "Relatório de visita com pendências e valor liberável." },
    ],
    includedTitle: "O que está incluído",
    includedIntro: "Pacote mensal com quatro visitas. Visita avulsa cobrada à parte.",
    included: [
      "Cadastro das etapas da obra com valores e prazos",
      "Quatro visitas mensais com registro fotográfico",
      "Medição de avanço físico por etapa",
      "Registro de serviços aprovados e reprovados",
      "Lista de pendências por visita",
      "Relatório de visita em PDF",
      "Indicação do valor liberável por etapa medida",
      "Acompanhamento do cronograma",
    ],
    faq: [
      {
        question: "Você contrata os profissionais?",
        answer:
          "Não neste serviço. Aqui eu acompanho e confiro a execução de quem você já contratou. " +
          "Se quiser que eu assuma a operação da obra, o serviço é o de gerenciamento.",
      },
      {
        question: "Com que frequência são as visitas?",
        answer:
          "O pacote padrão tem quatro visitas mensais, normalmente semanais. Obras em fase " +
          "crítica podem exigir mais — combinamos antes.",
      },
      {
        question: "O relatório serve para eu não pagar o empreiteiro?",
        answer:
          "O relatório mostra o que foi executado e o que está pendente, com fotos e medição. " +
          "Ele embasa a conversa. A decisão de pagamento continua sendo sua.",
      },
    ],
    legalNote:
      "Serviço de acompanhamento administrativo e conferência de serviços executados. A " +
      "fiscalização técnica formal de obra, com responsabilidade sobre a execução, exige " +
      "profissional legalmente habilitado com ART/RRT de fiscalização. O documento gerado aqui " +
      "é um relatório de visita.",
    closingTitle: "Reforma sem acompanhamento custa mais",
    closingSubtitle: "Retrabalho, material desperdiçado e atraso saem mais caro que a fiscalização.",
  },

  {
    slug: "orcamento-de-obra",
    serviceCode: "ORC-QUANT",
    seoTitle: "Orçamento e quantitativo de obra",
    seoDescription:
      "Levantamento de quantidades e composição de custos para reforma ou obra, separando material, mão de obra e equipamento, com planilha detalhada.",
    eyebrow: "Orçamento e quantitativo",
    title: "Saber quanto custa antes de começar é o que separa reforma de prejuízo.",
    subtitle:
      "Levanto as quantidades, monto a composição de custos separando material e mão de obra e " +
      "entrego a planilha com o preço final. Você negocia com fornecedor sabendo o número certo.",
    formTitle: "Pedir orçamento",
    ctaLabel: "Quero um orçamento",
    problemsTitle: "O problema do orçamento de boca",
    problems: [
      "O valor do pedreiro vem sem discriminar material, mão de obra e quantidade.",
      "Sem quantitativo, não dá para comparar duas propostas — os escopos são diferentes.",
      "Perdas de material não são consideradas e o valor estoura no meio da obra.",
      "Aditivo aparece toda semana porque o escopo nunca foi fechado por escrito.",
    ],
    stepsTitle: "Como funciona",
    steps: [
      { title: "Você envia", description: "Projeto, planta ou fotos e a descrição do que quer." },
      { title: "Eu levanto", description: "Quantidades a partir do projeto ou medição em campo." },
      { title: "Componho", description: "Material, mão de obra e equipamento, com perdas." },
      { title: "Aplico BDI", description: "Preço final com margem clara, não escondida." },
      { title: "Você recebe", description: "Planilha item a item, pronta para negociar." },
    ],
    includedTitle: "O que está incluído",
    included: [
      "Levantamento de quantitativos por serviço",
      "Composição de custo separando material, mão de obra e equipamento",
      "Percentual de perdas por tipo de serviço",
      "Aplicação de BDI com margem explícita",
      "Planilha orçamentária item a item",
      "Resumo por etapa da obra",
      "Preço final de venda por item e total",
    ],
    faq: [
      {
        question: "Preciso ter projeto?",
        answer:
          "Ajuda muito, mas não é obrigatório. Sem projeto, faço o levantamento em campo — o " +
          "orçamento fica um pouco menos preciso e o prazo aumenta.",
      },
      {
        question: "O orçamento serve para pedir financiamento?",
        answer:
          "Para uso próprio e para negociar com fornecedores, sim. Se a instituição exigir " +
          "orçamento vinculado a projeto executivo assinado, o projeto precisa ser elaborado por " +
          "profissional habilitado com ART/RRT.",
      },
      {
        question: "Quanto tempo leva?",
        answer:
          "Entre cinco e dez dias úteis, dependendo do tamanho da obra e do nível de " +
          "detalhamento pedido.",
      },
    ],
    legalNote:
      "Orçamento é peça comercial de planejamento de custos. Caso seja necessário orçamento " +
      "vinculado a projeto executivo assinado, o projeto deve ser elaborado por profissional " +
      "legalmente habilitado, com ART/RRT correspondente.",
    closingTitle: "Comece a obra com o número na mão",
    closingSubtitle: "Orçamento fechado é a única forma de saber se a proposta do pedreiro faz sentido.",
  },

  {
    slug: "gerenciamento-para-arquitetos",
    serviceCode: "GER-ARQ",
    seoTitle: "Gerenciamento de obra para arquitetos",
    seoDescription:
      "Braço operacional de obra para escritórios de arquitetura: cronograma, coordenação de empreiteiros, compras, medições e relatórios para o cliente final.",
    eyebrow: "Para escritórios de arquitetura",
    title: "Seu projeto merece uma obra que não consuma seu escritório.",
    subtitle:
      "Assumo a operação da obra em nome do escritório: cronograma, empreiteiros, compras, " +
      "medições e relatórios. Você mantém o projeto e o relacionamento; eu resolvo o canteiro.",
    formTitle: "Conversar sobre parceria",
    ctaLabel: "Quero conversar",
    problemsTitle: "O que consome o escritório",
    problems: [
      "O arquiteto vira gerente de obra sem querer, e o projeto seguinte atrasa.",
      "Compra de material e cotação tomam o tempo que deveria ser de projeto.",
      "Empreiteiro liga direto para o cliente e a informação se perde.",
      "O cliente cobra status e não existe relatório pronto para mandar.",
    ],
    stepsTitle: "Como funciona",
    steps: [
      { title: "Alinhamento", description: "Entendo o projeto, o escopo e o padrão do escritório." },
      { title: "Planejamento", description: "Cronograma, etapas e orçamento por etapa." },
      { title: "Operação", description: "Coordenação de empreiteiros, compras e canteiro." },
      { title: "Medição", description: "Avanço físico e liberação de pagamento por etapa." },
      { title: "Relatório", description: "Status periódico para o escritório e para o cliente." },
    ],
    includedTitle: "O que está incluído",
    included: [
      "Cronograma da obra com etapas e prazos",
      "Coordenação e acompanhamento de empreiteiros",
      "Cotação e compra de materiais",
      "Controle de medições e liberação de pagamentos",
      "Registro fotográfico contínuo da execução",
      "Relatórios periódicos para o escritório",
      "Relatório de status apresentável ao cliente final",
      "Ponto único de contato para o canteiro",
    ],
    faq: [
      {
        question: "Você concorre com o escritório?",
        answer:
          "Não. Não faço projeto e não vendo projeto. Atuo como operação de obra contratada pelo " +
          "escritório ou indicada por ele ao cliente final.",
      },
      {
        question: "Como é a remuneração?",
        answer:
          "Mensal por obra ou percentual sobre o valor da obra, conforme o porte. Combinamos na " +
          "primeira conversa.",
      },
      {
        question: "Quem responde tecnicamente pela obra?",
        answer:
          "A responsabilidade técnica pelo projeto e pela execução permanece com os profissionais " +
          "habilitados contratados, que recolhem suas respectivas ART/RRT. Meu papel é a gestão " +
          "operacional e administrativa.",
      },
    ],
    legalNote:
      "Serviço de gestão operacional e administrativa de obra. A responsabilidade técnica pelo " +
      "projeto e pela execução permanece com os profissionais legalmente habilitados contratados, " +
      "que devem recolher as respectivas ART/RRT.",
    closingTitle: "Volte a passar o dia projetando",
    closingSubtitle: "A obra continua andando — só que sem você no telefone com o pedreiro.",
  },
];

export function findLanding(slug: string): LandingContent | undefined {
  return landings.find((landing) => landing.slug === slug);
}
