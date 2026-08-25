import type { FindingSeed } from "./finding-library";

/**
 * Ampliação da biblioteca de problemas.
 *
 * Separado do arquivo base só por tamanho — o conteúdo tem o mesmo peso.
 *
 * Critério de inclusão: existe entrada suficiente para eu não precisar digitar
 * do zero em praticamente toda ocorrência de um apartamento novo. Por isso a
 * concentração em pintura, piso, revestimento e esquadrias, que são as
 * categorias que dominam uma entrega de chaves.
 *
 * As descrições continuam sem afirmar causa: descrevem o observável. Afirmar
 * origem de patologia é diagnóstico técnico e depende de habilitação.
 */
export const findingLibraryExtra: FindingSeed[] = [
  /* ------------------------------- Pintura -------------------------------- */
  {
    category: "PINTURA",
    title: "Pintura com cobertura insuficiente",
    defaultDescription:
      "Substrato aparente sob a tinta, indicando número de demãos abaixo do necessário.",
    defaultSeverity: "MEDIA",
  },
  {
    category: "PINTURA",
    title: "Textura de rolo aparente",
    defaultDescription: "Marcas de rolo perceptíveis, com relevo irregular na superfície.",
    defaultSeverity: "BAIXA",
  },
  {
    category: "PINTURA",
    title: "Pintura invadindo outro acabamento",
    defaultDescription:
      "Tinta de parede sobre teto, rodapé, batente ou esquadria, sem linha de corte definida.",
    defaultSeverity: "BAIXA",
  },
  {
    category: "PINTURA",
    title: "Diferença de tonalidade entre panos",
    defaultDescription:
      "Variação de cor perceptível entre trechos da mesma parede ou entre paredes do ambiente.",
    defaultSeverity: "MEDIA",
  },
  {
    category: "PINTURA",
    title: "Retoque de pintura aparente",
    defaultDescription: "Área de retoque visível, com diferença de brilho e textura do entorno.",
    defaultSeverity: "BAIXA",
  },
  {
    category: "PINTURA",
    title: "Pintura com sujeira incorporada",
    defaultDescription: "Partículas e pelos de rolo aderidos à película de tinta.",
    defaultSeverity: "BAIXA",
  },
  {
    category: "PINTURA",
    title: "Massa corrida com falha aparente",
    defaultDescription:
      "Ondulação, bolha ou rebaixo na massa, perceptível sob iluminação rasante.",
    defaultSeverity: "MEDIA",
  },
  {
    category: "PINTURA",
    title: "Canto de parede fora de esquadro",
    defaultDescription: "Aresta de encontro entre paredes irregular ou fora de esquadro.",
    defaultSeverity: "MEDIA",
  },
  {
    category: "PINTURA",
    title: "Teto com falha de acabamento",
    defaultDescription:
      "Teto com variação de textura, emenda aparente ou cobertura irregular da tinta.",
    defaultSeverity: "MEDIA",
  },

  /* --------------------------------- Piso --------------------------------- */
  {
    category: "PISO",
    title: "Peça de piso com som cavo",
    defaultDescription:
      "Peça apresenta som cavo à percussão, indicando falha de aderência ao contrapiso.",
    defaultSeverity: "ALTA",
  },
  {
    category: "PISO",
    title: "Rejunte de piso falho",
    defaultDescription: "Rejunte incompleto, retraído ou com trincas entre as peças.",
    defaultSeverity: "MEDIA",
  },
  {
    category: "PISO",
    title: "Junta de dilatação ausente",
    defaultDescription:
      "Área contínua de piso sem junta de dilatação nos encontros e no perímetro.",
    defaultSeverity: "ALTA",
  },
  {
    category: "PISO",
    title: "Recorte de piso mal executado",
    defaultDescription:
      "Corte irregular junto a ralo, batente ou canto, com folga aparente ou borda lascada.",
    defaultSeverity: "MEDIA",
  },
  {
    category: "PISO",
    title: "Piso laminado ou vinílico com bolha",
    defaultDescription: "Deslocamento localizado da manta, com relevo perceptível ao pisar.",
    defaultSeverity: "MEDIA",
  },
  {
    category: "PISO",
    title: "Desnível entre ambientes sem perfil de transição",
    defaultDescription:
      "Ressalto no encontro entre ambientes sem arremate, criando risco de tropeço.",
    defaultSeverity: "ALTA",
  },
  {
    category: "PISO",
    title: "Variação de tonalidade entre peças de piso",
    defaultDescription:
      "Peças de lotes diferentes assentadas no mesmo ambiente, com diferença de cor visível.",
    defaultSeverity: "MEDIA",
  },
  {
    category: "PISO",
    title: "Piso com manchamento",
    defaultDescription: "Mancha aderida à superfície, não removida na limpeza final.",
    defaultSeverity: "BAIXA",
  },

  /* ----------------------------- Revestimento ----------------------------- */
  {
    category: "REVESTIMENTO",
    title: "Paginação fora do previsto",
    defaultDescription:
      "Assentamento não segue a paginação especificada, com recortes em posição indevida.",
    defaultSeverity: "MEDIA",
  },
  {
    category: "REVESTIMENTO",
    title: "Junta com espessura irregular",
    defaultDescription: "Variação perceptível na espessura das juntas ao longo do pano.",
    defaultSeverity: "MEDIA",
  },
  {
    category: "REVESTIMENTO",
    title: "Arremate sem perfil ou cantoneira",
    defaultDescription:
      "Borda de revestimento sem arremate, com aresta de corte exposta.",
    defaultSeverity: "MEDIA",
  },
  {
    category: "REVESTIMENTO",
    title: "Desnível entre peças de revestimento",
    defaultDescription: "Ressalto perceptível ao tato entre peças adjacentes.",
    defaultSeverity: "MEDIA",
  },

  /* ------------------------ Esquadrias, portas, vidros -------------------- */
  {
    category: "ESQUADRIA",
    title: "Esquadria fora de nível ou prumo",
    defaultDescription: "Desvio verificado com nível, com folga desigual entre folha e marco.",
    defaultSeverity: "ALTA",
  },
  {
    category: "ESQUADRIA",
    title: "Trilho com resíduo de obra",
    defaultDescription: "Argamassa e detritos no trilho, prejudicando o deslizamento da folha.",
    defaultSeverity: "BAIXA",
  },
  {
    category: "ESQUADRIA",
    title: "Ausência de vedação entre esquadria e alvenaria",
    defaultDescription: "Encontro entre marco e alvenaria sem selante, com fresta aparente.",
    defaultSeverity: "ALTA",
  },
  {
    category: "PORTA",
    title: "Batente com folga excessiva",
    defaultDescription: "Folga entre folha e batente acima do usual, com passagem de luz.",
    defaultSeverity: "MEDIA",
  },
  {
    category: "PORTA",
    title: "Porta empenada",
    defaultDescription: "Folha apresenta empenamento, sem contato uniforme com o batente.",
    defaultSeverity: "ALTA",
  },
  {
    category: "PORTA",
    title: "Dobradiça mal fixada",
    defaultDescription: "Parafuso frouxo ou espanado, com movimentação da dobradiça.",
    defaultSeverity: "MEDIA",
  },
  {
    category: "PORTA",
    title: "Acabamento da folha danificado",
    defaultDescription: "Lascado, risco ou descolamento do revestimento da folha.",
    defaultSeverity: "BAIXA",
  },
  {
    category: "VIDRO",
    title: "Vidro riscado",
    defaultDescription: "Risco superficial no vidro, visível sob incidência de luz.",
    defaultSeverity: "MEDIA",
  },
  {
    category: "VIDRO",
    title: "Silicone de vedação em excesso",
    defaultDescription: "Excesso de silicone ou massa transbordando o perfil.",
    defaultSeverity: "BAIXA",
  },

  /* --------------------------- Elétrica e hidráulica ---------------------- */
  {
    category: "ELETRICA",
    title: "Espelho de tomada trincado",
    defaultDescription: "Placa de acabamento com trinca ou quebra.",
    defaultSeverity: "BAIXA",
  },
  {
    category: "ELETRICA",
    title: "Tomada com polaridade invertida",
    defaultDescription: "Teste indica fase e neutro invertidos no ponto.",
    defaultSeverity: "ALTA",
  },
  {
    category: "ELETRICA",
    title: "Ponto de iluminação descentralizado",
    defaultDescription: "Ponto deslocado em relação ao eixo do ambiente ou do forro.",
    defaultSeverity: "BAIXA",
  },
  {
    category: "ELETRICA",
    title: "Fiação exposta em caixa de passagem",
    defaultDescription: "Condutores sem terminal ou caixa sem tampa de proteção.",
    defaultSeverity: "CRITICA",
  },
  {
    category: "HIDRAULICA",
    title: "Registro emperrado",
    defaultDescription: "Registro apresenta resistência ou não fecha completamente.",
    defaultSeverity: "ALTA",
  },
  {
    category: "HIDRAULICA",
    title: "Canopla de registro desalinhada",
    defaultDescription: "Acabamento do registro desalinhado ou afastado do revestimento.",
    defaultSeverity: "BAIXA",
  },
  {
    category: "HIDRAULICA",
    title: "Retorno de odor em ponto de esgoto",
    defaultDescription: "Odor perceptível no ponto, indicando fecho hídrico insuficiente.",
    defaultSeverity: "ALTA",
  },

  /* --------------------- Forro, marcenaria, acabamento -------------------- */
  {
    category: "FORRO_GESSO",
    title: "Emenda de placa de gesso aparente",
    defaultDescription: "Junta entre placas visível, sem tratamento ou com fita aparente.",
    defaultSeverity: "MEDIA",
  },
  {
    category: "FORRO_GESSO",
    title: "Tabica de forro desalinhada",
    defaultDescription: "Perfil de arremate do forro fora de alinhamento com a parede.",
    defaultSeverity: "BAIXA",
  },
  {
    category: "ACABAMENTO",
    title: "Soleira ou peitoril com caimento invertido",
    defaultDescription:
      "Peça com caimento voltado para dentro do ambiente, favorecendo entrada de água.",
    defaultSeverity: "ALTA",
  },
  {
    category: "ACABAMENTO",
    title: "Silicone aplicado de forma irregular",
    defaultDescription: "Cordão de silicone com espessura desigual, falhas ou excesso.",
    defaultSeverity: "BAIXA",
  },
  {
    category: "MARCENARIA",
    title: "Bancada com apoio insuficiente",
    defaultDescription:
      "Bancada apresenta flexão ou movimentação sob esforço, com fixação aparentemente frágil.",
    defaultSeverity: "ALTA",
  },
  {
    category: "LIMPEZA",
    title: "Resíduo de argamassa sobre revestimento",
    defaultDescription:
      "Película de argamassa sobre o revestimento, não removida na limpeza final.",
    defaultSeverity: "BAIXA",
  },
  {
    category: "LIMPEZA",
    title: "Etiqueta e proteção de obra não removidas",
    defaultDescription: "Adesivos, plásticos ou fitas de proteção remanescentes.",
    defaultSeverity: "BAIXA",
  },

  /* ------------------------------- Estrutura ------------------------------ */
  {
    category: "ESTRUTURA",
    title: "Fissura em encontro de alvenaria e estrutura",
    defaultDescription:
      "Fissura no encontro entre alvenaria e elemento estrutural. Recomenda-se avaliação " +
      "por profissional habilitado quanto à origem e à evolução.",
    defaultSeverity: "ALTA",
  },

  /* --------------------------------- Outro -------------------------------- */
  {
    category: "OUTRO",
    title: "Acabamento divergente do memorial descritivo",
    defaultDescription:
      "Material ou modelo instalado difere do especificado no memorial descritivo apresentado.",
    defaultSeverity: "ALTA",
  },
];
