/**
 * Biblioteca de problemas recorrentes.
 *
 * Durante a vistoria, escolher um item daqui preenche título, descrição e
 * gravidade de uma vez. É o que faz a diferença entre digitar 40 ocorrências
 * em pé no apartamento e tocar três vezes por ocorrência.
 *
 * A descrição é escrita para ir direto ao relatório entregue à construtora:
 * objetiva, sem adjetivo e sem afirmação de causa (afirmar causa é diagnóstico
 * técnico, que exige habilitação — ver src/lib/compliance).
 */

export type FindingSeed = {
  category: string;
  title: string;
  defaultDescription: string;
  defaultSeverity: "CRITICA" | "ALTA" | "MEDIA" | "BAIXA";
};

import { findingLibraryExtra } from "./finding-library-extra";

const findingLibraryBase: FindingSeed[] = [
  // Pintura
  {
    category: "PINTURA",
    title: "Falha de acabamento na pintura",
    defaultDescription:
      "Superfície com cobertura irregular, apresentando variação de tonalidade e marcas de aplicação.",
    defaultSeverity: "BAIXA",
  },
  {
    category: "PINTURA",
    title: "Respingo de tinta sobre outro acabamento",
    defaultDescription:
      "Respingos de tinta sobre piso, esquadria ou louça, sem remoção após a execução.",
    defaultSeverity: "BAIXA",
  },
  {
    category: "PINTURA",
    title: "Descascamento ou bolha na pintura",
    defaultDescription: "Camada de tinta com desprendimento ou formação de bolhas na superfície.",
    defaultSeverity: "MEDIA",
  },
  {
    category: "PINTURA",
    title: "Emenda de pintura aparente",
    defaultDescription: "Emenda visível entre demãos, com diferença de textura e brilho.",
    defaultSeverity: "BAIXA",
  },

  // Alvenaria e estrutura
  {
    category: "ALVENARIA",
    title: "Parede fora de prumo",
    defaultDescription:
      "Desvio de prumo verificado com nível, comprometendo o alinhamento do ambiente.",
    defaultSeverity: "ALTA",
  },
  {
    category: "ALVENARIA",
    title: "Superfície de parede irregular",
    defaultDescription:
      "Parede com ondulações e falta de planeza perceptíveis sob iluminação rasante.",
    defaultSeverity: "MEDIA",
  },
  {
    category: "ESTRUTURA",
    title: "Fissura em parede",
    defaultDescription:
      "Fissura visível na superfície. Recomenda-se avaliação por profissional habilitado quanto à origem e evolução.",
    defaultSeverity: "ALTA",
  },
  {
    category: "ESTRUTURA",
    title: "Guarda-corpo com fixação frouxa",
    defaultDescription:
      "Guarda-corpo apresenta movimentação ao ser solicitado manualmente. Risco de segurança.",
    defaultSeverity: "CRITICA",
  },

  // Revestimento e piso
  {
    category: "REVESTIMENTO",
    title: "Peça de revestimento desalinhada",
    defaultDescription: "Peça assentada fora de alinhamento em relação às adjacentes.",
    defaultSeverity: "MEDIA",
  },
  {
    category: "REVESTIMENTO",
    title: "Revestimento com som cavo",
    defaultDescription:
      "Peça apresenta som cavo à percussão, indicando falha de aderência ao substrato.",
    defaultSeverity: "ALTA",
  },
  {
    category: "REVESTIMENTO",
    title: "Rejunte falho ou ausente",
    defaultDescription: "Rejunte incompleto, com falhas, trincas ou ausência em trechos.",
    defaultSeverity: "MEDIA",
  },
  {
    category: "REVESTIMENTO",
    title: "Peça trincada ou lascada",
    defaultDescription: "Peça de revestimento com trinca ou lascamento visível.",
    defaultSeverity: "MEDIA",
  },
  {
    category: "PISO",
    title: "Desnível entre peças de piso",
    defaultDescription: "Diferença de nível entre peças adjacentes, formando ressalto perceptível.",
    defaultSeverity: "MEDIA",
  },
  {
    category: "PISO",
    title: "Caimento inadequado para o ralo",
    defaultDescription:
      "Água não escoa integralmente para o ralo, formando empoçamento após teste.",
    defaultSeverity: "ALTA",
  },
  {
    category: "PISO",
    title: "Piso riscado ou manchado",
    defaultDescription: "Superfície com riscos ou manchas decorrentes da execução da obra.",
    defaultSeverity: "BAIXA",
  },
  {
    category: "ACABAMENTO",
    title: "Rodapé descolado ou desalinhado",
    defaultDescription: "Rodapé com afastamento da parede ou desalinhamento entre peças.",
    defaultSeverity: "BAIXA",
  },

  // Esquadrias, portas e vidros
  {
    category: "ESQUADRIA",
    title: "Esquadria com dificuldade de operação",
    defaultDescription:
      "Folha apresenta resistência ou travamento durante a abertura e o fechamento.",
    defaultSeverity: "MEDIA",
  },
  {
    category: "ESQUADRIA",
    title: "Vedação de esquadria comprometida",
    defaultDescription:
      "Borracha de vedação ausente, deslocada ou danificada, com passagem de ar ou água.",
    defaultSeverity: "ALTA",
  },
  {
    category: "ESQUADRIA",
    title: "Esquadria riscada ou amassada",
    defaultDescription: "Perfil com risco, amassado ou dano superficial na pintura eletrostática.",
    defaultSeverity: "BAIXA",
  },
  {
    category: "PORTA",
    title: "Porta desalinhada",
    defaultDescription:
      "Folga irregular entre folha e batente, com atrito ou fechamento incompleto.",
    defaultSeverity: "MEDIA",
  },
  {
    category: "PORTA",
    title: "Fechadura com defeito",
    defaultDescription: "Fechadura não trava, gira em falso ou apresenta resistência ao acionamento.",
    defaultSeverity: "ALTA",
  },
  {
    category: "VIDRO",
    title: "Vidro trincado",
    defaultDescription: "Vidro apresenta trinca visível.",
    defaultSeverity: "ALTA",
  },
  {
    category: "VIDRO",
    title: "Box mal fixado",
    defaultDescription: "Box apresenta movimentação ou vedação inferior insuficiente.",
    defaultSeverity: "MEDIA",
  },

  // Hidráulica
  {
    category: "HIDRAULICA",
    title: "Vazamento em ponto hidráulico",
    defaultDescription: "Vazamento constatado durante teste de estanqueidade no ponto indicado.",
    defaultSeverity: "CRITICA",
  },
  {
    category: "HIDRAULICA",
    title: "Escoamento lento no ralo",
    defaultDescription: "Ralo apresenta escoamento lento durante o teste com água.",
    defaultSeverity: "MEDIA",
  },
  {
    category: "HIDRAULICA",
    title: "Pressão de água insuficiente",
    defaultDescription: "Vazão no ponto abaixo do esperado em comparação aos demais pontos.",
    defaultSeverity: "ALTA",
  },
  {
    category: "HIDRAULICA",
    title: "Sifão ausente ou mal instalado",
    defaultDescription: "Sifão não instalado, mal vedado ou com retorno de odor.",
    defaultSeverity: "MEDIA",
  },
  {
    category: "LOUCA_METAL",
    title: "Louça trincada ou lascada",
    defaultDescription: "Peça sanitária com trinca ou lascamento.",
    defaultSeverity: "ALTA",
  },
  {
    category: "LOUCA_METAL",
    title: "Metal com acabamento danificado",
    defaultDescription: "Torneira ou registro com riscos, oxidação ou acabamento comprometido.",
    defaultSeverity: "BAIXA",
  },
  {
    category: "LOUCA_METAL",
    title: "Cuba mal vedada na bancada",
    defaultDescription: "Vedação entre cuba e bancada incompleta, com passagem de água.",
    defaultSeverity: "MEDIA",
  },

  // Elétrica e gás
  {
    category: "ELETRICA",
    title: "Tomada sem energia",
    defaultDescription: "Ponto testado não apresenta tensão.",
    defaultSeverity: "ALTA",
  },
  {
    category: "ELETRICA",
    title: "Tomada ou interruptor desalinhado",
    defaultDescription: "Espelho fora de nível ou afastado da parede.",
    defaultSeverity: "BAIXA",
  },
  {
    category: "ELETRICA",
    title: "Ausência de aterramento no ponto",
    defaultDescription:
      "Teste indica ausência de condutor de proteção no ponto. Risco de segurança.",
    defaultSeverity: "CRITICA",
  },
  {
    category: "ELETRICA",
    title: "Circuito sem identificação no quadro",
    defaultDescription: "Disjuntores do quadro de distribuição não identificados.",
    defaultSeverity: "MEDIA",
  },
  {
    category: "ELETRICA",
    title: "Ponto de iluminação inoperante",
    defaultDescription: "Ponto não aciona ao acionar o interruptor correspondente.",
    defaultSeverity: "ALTA",
  },
  {
    category: "GAS",
    title: "Ponto de gás sem tampão de segurança",
    defaultDescription: "Ponto de gás entregue sem tampão ou registro de bloqueio.",
    defaultSeverity: "CRITICA",
  },

  // Forro, impermeabilização e marcenaria
  {
    category: "FORRO_GESSO",
    title: "Trinca em forro de gesso",
    defaultDescription: "Trinca visível na superfície do forro, em junta ou emenda de placa.",
    defaultSeverity: "MEDIA",
  },
  {
    category: "FORRO_GESSO",
    title: "Forro com desnível",
    defaultDescription: "Forro apresenta desnível ou barriga perceptível.",
    defaultSeverity: "MEDIA",
  },
  {
    category: "IMPERMEABILIZACAO",
    title: "Sinal de umidade em área molhada",
    defaultDescription:
      "Mancha de umidade em parede ou teto adjacente a área molhada. Recomenda-se verificação da impermeabilização.",
    defaultSeverity: "CRITICA",
  },
  {
    category: "IMPERMEABILIZACAO",
    title: "Rodapé de impermeabilização insuficiente",
    defaultDescription: "Impermeabilização não sobe a altura adequada nas paredes da área molhada.",
    defaultSeverity: "ALTA",
  },
  {
    category: "MARCENARIA",
    title: "Porta de armário desalinhada",
    defaultDescription: "Folgas irregulares entre portas e frentes do armário.",
    defaultSeverity: "BAIXA",
  },
  {
    category: "MARCENARIA",
    title: "Ferragem de armário com defeito",
    defaultDescription: "Dobradiça ou corrediça com folga, ruído ou funcionamento irregular.",
    defaultSeverity: "MEDIA",
  },

  // Limpeza e geral
  {
    category: "LIMPEZA",
    title: "Resíduo de obra não removido",
    defaultDescription: "Presença de argamassa, tinta ou entulho remanescente da execução.",
    defaultSeverity: "BAIXA",
  },
  {
    category: "ACABAMENTO",
    title: "Arremate incompleto",
    defaultDescription: "Encontro entre materiais sem arremate ou com acabamento irregular.",
    defaultSeverity: "BAIXA",
  },
  {
    category: "OUTRO",
    title: "Item previsto não entregue",
    defaultDescription: "Item constante do memorial descritivo não localizado no imóvel.",
    defaultSeverity: "ALTA",
  },
];

export const findingLibrary: FindingSeed[] = [...findingLibraryBase, ...findingLibraryExtra];
