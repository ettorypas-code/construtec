/**
 * Catálogo de serviços.
 *
 * Cada entrada carrega a regra legal do serviço. É daqui que a guarda de
 * terminologia (src/lib/compliance) tira a resposta para "posso emitir este
 * documento?". Os textos de `legalNotes` aparecem na interface no momento em
 * que o serviço é escolhido — não escondidos em um rodapé.
 *
 * Os níveis:
 *   LIVRE               → presto e documento por conta própria
 *   REQUER_HABILITACAO  → presto, mas o documento formal exige responsável técnico
 *   RESTRITO            → não presto sem registro profissional próprio
 */

export type PriceTierSeed = {
  label: string;
  /** Limite superior da faixa, em m². `null` = "acima disso". */
  maxAreaSqm: number | null;
  priceCents: number;
  note?: string | null;
};

export type ServiceSeed = {
  code: string;
  name: string;
  category: "VISTORIA" | "ORCAMENTO" | "FISCALIZACAO" | "GERENCIAMENTO" | "TECNICO";
  shortPitch: string;
  description: string;
  basePriceCents: number | null;
  priceNote: string | null;
  restrictionLevel: "LIVRE" | "REQUER_HABILITACAO" | "RESTRITO";
  requiresTechnicalResponsible: boolean;
  requiresArtRrt: boolean;
  legalNotes: string | null;
  defaultDocumentKind: string | null;
  active: boolean;
  sortOrder: number;
  /** Adicional cobrado sobre um serviço-base. */
  isAddon?: boolean;
  /**
   * Faixas de preço por metragem.
   *
   * Preço único obriga a escolher entre perder o serviço pequeno ou trabalhar
   * de graça no grande. A faixa resolve isso sem inventar "planos" que se
   * diferenciam por qualidade de relatório — o relatório é sempre o completo,
   * porque ele é gerado automaticamente e piorá-lo de propósito seria perder
   * dinheiro para parecer que se está ganhando.
   */
  priceTiers?: PriceTierSeed[];
};

export const serviceCatalog: ServiceSeed[] = [
  {
    code: "VIST-ENTREGA",
    name: "Vistoria de entrega de chaves",
    category: "VISTORIA",
    shortPitch: "Acompanhamento da entrega de imóvel novo com registro de não conformidades.",
    description:
      "Vistoria presencial do imóvel no momento da entrega, com checklist por ambiente, " +
      "registro fotográfico das não conformidades encontradas e relatório organizado para " +
      "apresentação à construtora.",
    basePriceCents: 39900,
    priceNote: "Faixa por metragem. Sempre com relatório fotográfico e classificação por gravidade.",
    priceTiers: [
      { label: "Até 60 m²", maxAreaSqm: 60, priceCents: 29900 },
      { label: "61 a 90 m²", maxAreaSqm: 90, priceCents: 39900 },
      { label: "91 a 130 m²", maxAreaSqm: 130, priceCents: 49900 },
      { label: "131 a 180 m²", maxAreaSqm: 180, priceCents: 64900 },
      {
        label: "Acima de 180 m²",
        maxAreaSqm: null,
        priceCents: 0,
        note: "Sob orçamento — avaliar nº de ambientes e padrão de acabamento.",
      },
    ],
    restrictionLevel: "LIVRE",
    requiresTechnicalResponsible: false,
    requiresArtRrt: false,
    legalNotes:
      "Serviço de acompanhamento e registro documental. O documento entregue é um relatório " +
      "de vistoria com registro fotográfico, sem caráter de laudo técnico pericial. " +
      "Não substitui perícia judicial nem inspeção predial normatizada.",
    defaultDocumentKind: "RELATORIO_VISTORIA",
    active: true,
    sortOrder: 10,
  },
  {
    code: "VIST-LOCACAO",
    name: "Vistoria de locação (entrada e saída)",
    category: "VISTORIA",
    shortPitch: "Registro do estado do imóvel no início e no fim da locação.",
    description:
      "Levantamento fotográfico e descritivo do estado de conservação do imóvel, ambiente por " +
      "ambiente, para servir de referência entre locador e locatário.",
    basePriceCents: 34900,
    priceNote: "Por vistoria. Pacote entrada + saída fecha com desconto.",
    priceTiers: [
      { label: "Até 60 m²", maxAreaSqm: 60, priceCents: 34900 },
      { label: "61 a 90 m²", maxAreaSqm: 90, priceCents: 42900 },
      { label: "91 a 130 m²", maxAreaSqm: 130, priceCents: 52900 },
      {
        label: "Acima de 130 m²",
        maxAreaSqm: null,
        priceCents: 0,
        note: "Sob orçamento.",
      },
    ],
    restrictionLevel: "LIVRE",
    requiresTechnicalResponsible: false,
    requiresArtRrt: false,
    legalNotes:
      "Relatório fotográfico descritivo. Documento de registro entre as partes, sem natureza " +
      "pericial.",
    defaultDocumentKind: "RELATORIO_FOTOGRAFICO",
    active: true,
    sortOrder: 20,
  },
  {
    code: "ORC-QUANT",
    name: "Orçamento e quantitativo de obra",
    category: "ORCAMENTO",
    shortPitch: "Levantamento de quantidades e composição de custos para reforma ou obra.",
    description:
      "Levantamento de quantitativos a partir de projeto ou medição em campo, composição de " +
      "custos separando material, mão de obra e equipamento, aplicação de perdas e BDI, e " +
      "entrega de planilha orçamentária com preço final.",
    basePriceCents: 80000,
    priceNote: "Valor de referência. Varia conforme área e nível de detalhamento.",
    restrictionLevel: "LIVRE",
    requiresTechnicalResponsible: false,
    requiresArtRrt: false,
    legalNotes:
      "Orçamento é peça comercial. Caso o cliente precise do orçamento vinculado a projeto " +
      "executivo assinado, o projeto deve ser elaborado por profissional habilitado com ART/RRT.",
    defaultDocumentKind: null,
    active: true,
    sortOrder: 30,
  },
  {
    code: "FISC-REFORMA",
    name: "Fiscalização e acompanhamento de reforma",
    category: "FISCALIZACAO",
    shortPitch: "Visitas periódicas com medição de avanço, controle de etapas e relatório.",
    description:
      "Acompanhamento da execução da reforma com visitas programadas, conferência do serviço " +
      "executado contra o contratado, medição de avanço físico por etapa, registro fotográfico " +
      "de pendências e relatório de visita para liberação de pagamento ao executante.",
    basePriceCents: 120000,
    priceNote: "Mensal, com quatro visitas. Visita avulsa cobrada à parte.",
    restrictionLevel: "REQUER_HABILITACAO",
    requiresTechnicalResponsible: false,
    requiresArtRrt: false,
    legalNotes:
      "Acompanhamento administrativo e de conferência de serviços. A fiscalização técnica " +
      "formal de obra, com responsabilidade sobre a execução, exige profissional habilitado " +
      "com ART/RRT de fiscalização. Este serviço é de gestão e conferência, e o documento " +
      "gerado é um relatório de visita.",
    defaultDocumentKind: "RELATORIO_VISITA",
    active: true,
    sortOrder: 40,
  },
  {
    code: "GER-ARQ",
    name: "Gerenciamento de obra para arquitetos",
    category: "GERENCIAMENTO",
    shortPitch: "Braço operacional de obra para escritórios de arquitetura.",
    description:
      "Operação da obra em nome do escritório: cronograma, coordenação de empreiteiros, " +
      "compras, medições, controle de pagamentos e relatórios periódicos para o arquiteto e " +
      "para o cliente final.",
    basePriceCents: 250000,
    priceNote: "Mensal por obra, ou percentual sobre o valor da obra.",
    restrictionLevel: "REQUER_HABILITACAO",
    requiresTechnicalResponsible: false,
    requiresArtRrt: false,
    legalNotes:
      "Gestão operacional e administrativa da obra. A responsabilidade técnica pelo projeto e " +
      "pela execução permanece com os profissionais habilitados contratados, que devem " +
      "recolher suas respectivas ART/RRT.",
    defaultDocumentKind: "RELATORIO_ACOMPANHAMENTO",
    active: true,
    sortOrder: 50,
  },
  {
    code: "VIST-CAUTELAR",
    name: "Vistoria cautelar de vizinhança",
    category: "TECNICO",
    shortPitch: "Registro do estado de imóveis vizinhos antes do início de uma obra.",
    description:
      "Levantamento do estado dos imóveis lindeiros antes do início de obra, para servir de " +
      "referência em eventual discussão sobre danos.",
    basePriceCents: null,
    priceNote: "Sob consulta.",
    restrictionLevel: "RESTRITO",
    requiresTechnicalResponsible: true,
    requiresArtRrt: true,
    legalNotes:
      "Vistoria cautelar com validade técnica exige profissional habilitado (CREA/CAU) com " +
      "ART/RRT recolhida. Sem responsável técnico habilitado, este serviço não deve ser " +
      "ofertado como vistoria cautelar.",
    defaultDocumentKind: "LAUDO_TECNICO",
    active: false,
    sortOrder: 60,
  },
  {
    code: "INSP-PREDIAL",
    name: "Inspeção predial",
    category: "TECNICO",
    shortPitch: "Avaliação das condições de uso e manutenção de edificação.",
    description:
      "Inspeção das condições técnicas, de uso e de manutenção da edificação, conforme " +
      "norma aplicável, com classificação de anomalias e plano de ação.",
    basePriceCents: null,
    priceNote: "Sob consulta.",
    restrictionLevel: "RESTRITO",
    requiresTechnicalResponsible: true,
    requiresArtRrt: true,
    legalNotes:
      "Inspeção predial normatizada (ABNT NBR 16747) exige profissional habilitado e ART/RRT. " +
      "Serviço mantido inativo no catálogo até haver responsável técnico configurado.",
    defaultDocumentKind: "INSPECAO_PREDIAL",
    active: false,
    sortOrder: 70,
  },
  {
    code: "PATOLOGIA",
    name: "Investigação de patologia construtiva",
    category: "TECNICO",
    shortPitch: "Diagnóstico de manifestações patológicas e recomendação de tratamento.",
    description:
      "Investigação de manifestações patológicas (fissuras, infiltrações, destacamentos), " +
      "identificação de causa provável e recomendação de tratamento.",
    basePriceCents: null,
    priceNote: "Sob consulta.",
    restrictionLevel: "RESTRITO",
    requiresTechnicalResponsible: true,
    requiresArtRrt: true,
    legalNotes:
      "Diagnóstico de patologia com conclusão técnica sobre causa e responsabilidade configura " +
      "laudo técnico e exige profissional habilitado com ART/RRT.",
    defaultDocumentKind: "LAUDO_TECNICO",
    active: false,
    sortOrder: 80,
  },

  /* --------------------------------------------------------------------------
   * ADICIONAIS
   *
   * Cobrados sobre um serviço-base. Existem porque é aqui que o custo real
   * varia: uma revistoria é uma viagem inteira a mais, e conferir memorial
   * descritivo é trabalho de escritório antes de ir a campo. Classificar
   * ocorrência por gravidade, ao contrário, não custa nada — o sistema faz — e
   * por isso nunca vira adicional.
   * ------------------------------------------------------------------------ */

  {
    code: "ADIC-REVISTORIA",
    name: "Revistoria de conferência das correções",
    category: "VISTORIA",
    shortPitch: "Segunda visita para conferir, item a item, o que a construtora corrigiu.",
    description:
      "Retorno ao imóvel após o prazo de correção dado à construtora, conferindo cada " +
      "apontamento do relatório anterior e registrando o que foi corrigido, o que foi " +
      "corrigido parcialmente e o que segue pendente. Entrega de relatório comparativo.",
    basePriceCents: 28000,
    priceNote: "Por visita, no mesmo imóvel já vistoriado.",
    restrictionLevel: "LIVRE",
    requiresTechnicalResponsible: false,
    requiresArtRrt: false,
    legalNotes:
      "Relatório comparativo de conferência, sem caráter de laudo técnico pericial.",
    defaultDocumentKind: "RELATORIO_VISTORIA",
    active: true,
    isAddon: true,
    sortOrder: 100,
  },
  {
    code: "ADIC-MEMORIAL",
    name: "Conferência contra o memorial descritivo",
    category: "VISTORIA",
    shortPitch: "Confere item a item o que foi prometido no memorial contra o que foi entregue.",
    description:
      "Leitura do memorial descritivo e do contrato antes da vistoria, montagem de checklist " +
      "específico do empreendimento e conferência em campo dos acabamentos, marcas e " +
      "especificações prometidos.",
    basePriceCents: 19000,
    priceNote: "Exige que o cliente forneça o memorial descritivo.",
    restrictionLevel: "LIVRE",
    requiresTechnicalResponsible: false,
    requiresArtRrt: false,
    legalNotes:
      "Conferência documental comparativa. Divergências apontadas são de natureza descritiva; " +
      "a interpretação contratual cabe ao cliente e a seu advogado.",
    defaultDocumentKind: "RELATORIO_NAO_CONFORMIDADES",
    active: true,
    isAddon: true,
    sortOrder: 110,
  },
  {
    code: "ADIC-ACOMPANHA",
    name: "Acompanhamento da entrega junto à construtora",
    category: "VISTORIA",
    shortPitch: "Estou presente no ato da entrega, com o representante da construtora.",
    description:
      "Presença no horário marcado pela construtora para o ato de entrega, apresentação dos " +
      "apontamentos ao representante e registro do que foi aceito como pendência.",
    basePriceCents: 22000,
    priceNote: "Horário definido pela construtora. Cobrado por ato de entrega.",
    restrictionLevel: "LIVRE",
    requiresTechnicalResponsible: false,
    requiresArtRrt: false,
    legalNotes:
      "Acompanhamento e registro. Não constitui representação legal do cliente perante a " +
      "construtora.",
    defaultDocumentKind: null,
    active: true,
    isAddon: true,
    sortOrder: 120,
  },
  {
    code: "ADIC-DESLOCAMENTO",
    name: "Deslocamento fora da região de atendimento",
    category: "VISTORIA",
    shortPitch: "Cobre combustível e horas de estrada além do raio de atendimento padrão.",
    description:
      "Aplicado quando o imóvel está fora do raio de atendimento sem custo adicional.",
    basePriceCents: 12000,
    priceNote: "Por deslocamento. Ajuste conforme a distância.",
    restrictionLevel: "LIVRE",
    requiresTechnicalResponsible: false,
    requiresArtRrt: false,
    legalNotes: null,
    defaultDocumentKind: null,
    active: true,
    isAddon: true,
    sortOrder: 130,
  },
];

