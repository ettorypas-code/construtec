/**
 * Modelos de checklist por tipo de imóvel.
 *
 * A categoria de cada item é a categoria que já vem pré-selecionada quando uma
 * ocorrência é aberta a partir dele. Isso tira um toque do fluxo mobile — que é
 * o ponto inteiro deste arquivo existir.
 */

export type ChecklistItemSeed = { label: string; category: string };
export type ChecklistRoomSeed = { name: string; items: ChecklistItemSeed[] };
export type ChecklistTemplateSeed = {
  name: string;
  propertyKind: string;
  description: string;
  serviceCode: string | null;
  isDefault: boolean;
  /**
   * Como os itens são avaliados.
   *
   * ESTADO usa cinco níveis (Novo → Péssimo) e serve tanto para locação quanto
   * para entrega: mesmo em imóvel novo, "rodapé com respingo de tinta" não é a
   * mesma coisa que "rodapé descolado", e um único "não conforme" perde essa
   * diferença justamente onde ela decide a prioridade da correção.
   */
  ratingScale: "ESTADO" | "CONFORMIDADE";
  rooms: ChecklistRoomSeed[];
};

const commonRoomItems: ChecklistItemSeed[] = [
  { label: "Piso", category: "PISO" },
  { label: "Rodapé", category: "ACABAMENTO" },
  { label: "Paredes", category: "ALVENARIA" },
  { label: "Pintura", category: "PINTURA" },
  { label: "Teto e forro", category: "FORRO_GESSO" },
  { label: "Janela / esquadria", category: "ESQUADRIA" },
  { label: "Vidros", category: "VIDRO" },
  { label: "Porta e ferragens", category: "PORTA" },
  { label: "Tomadas", category: "ELETRICA" },
  { label: "Interruptores", category: "ELETRICA" },
  { label: "Iluminação", category: "ELETRICA" },
  { label: "Limpeza", category: "LIMPEZA" },
];

export const checklistTemplates: ChecklistTemplateSeed[] = [
  {
    name: "Entrega de chaves — Apartamento",
    propertyKind: "APARTAMENTO",
    description:
      "Checklist completo para vistoria de entrega de apartamento novo, ambiente por ambiente.",
    serviceCode: "VIST-ENTREGA",
    isDefault: true,
    ratingScale: "ESTADO",
    rooms: [
      {
        name: "Entrada e circulação",
        items: [
          { label: "Porta de entrada e fechadura", category: "PORTA" },
          { label: "Soleira", category: "ACABAMENTO" },
          { label: "Piso", category: "PISO" },
          { label: "Rodapé", category: "ACABAMENTO" },
          { label: "Paredes e pintura", category: "PINTURA" },
          { label: "Teto e forro", category: "FORRO_GESSO" },
          { label: "Interfone / vídeo porteiro", category: "ELETRICA" },
          { label: "Quadro de distribuição", category: "ELETRICA" },
          { label: "Iluminação", category: "ELETRICA" },
        ],
      },
      {
        name: "Sala",
        items: [
          ...commonRoomItems,
          { label: "Ponto de TV e dados", category: "ELETRICA" },
          { label: "Ponto de ar-condicionado", category: "ELETRICA" },
          { label: "Nivelamento e caimento do piso", category: "PISO" },
        ],
      },
      {
        name: "Cozinha",
        items: [
          { label: "Piso", category: "PISO" },
          { label: "Revestimento de parede", category: "REVESTIMENTO" },
          { label: "Rejunte", category: "REVESTIMENTO" },
          { label: "Bancada", category: "ACABAMENTO" },
          { label: "Cuba e válvula", category: "LOUCA_METAL" },
          { label: "Torneira", category: "LOUCA_METAL" },
          { label: "Pontos hidráulicos (água fria/quente)", category: "HIDRAULICA" },
          { label: "Ralo e sifão", category: "HIDRAULICA" },
          { label: "Ponto de gás", category: "GAS" },
          { label: "Tomadas e circuitos", category: "ELETRICA" },
          { label: "Ponto de exaustão / coifa", category: "ELETRICA" },
          { label: "Armários (quando entregues)", category: "MARCENARIA" },
          { label: "Janela / esquadria", category: "ESQUADRIA" },
          { label: "Teto e forro", category: "FORRO_GESSO" },
          { label: "Pintura", category: "PINTURA" },
          { label: "Limpeza", category: "LIMPEZA" },
        ],
      },
      {
        name: "Área de serviço",
        items: [
          { label: "Piso e caimento para o ralo", category: "PISO" },
          { label: "Revestimento de parede", category: "REVESTIMENTO" },
          { label: "Tanque", category: "LOUCA_METAL" },
          { label: "Torneira", category: "LOUCA_METAL" },
          { label: "Ponto de máquina de lavar", category: "HIDRAULICA" },
          { label: "Ralo e sifão", category: "HIDRAULICA" },
          { label: "Impermeabilização aparente", category: "IMPERMEABILIZACAO" },
          { label: "Tomadas", category: "ELETRICA" },
          { label: "Janela / esquadria", category: "ESQUADRIA" },
          { label: "Pintura", category: "PINTURA" },
        ],
      },
      {
        name: "Banheiro social",
        items: [
          { label: "Piso e caimento para o ralo", category: "PISO" },
          { label: "Revestimento de parede", category: "REVESTIMENTO" },
          { label: "Rejunte e cantos", category: "REVESTIMENTO" },
          { label: "Bacia sanitária", category: "LOUCA_METAL" },
          { label: "Caixa acoplada e acionamento", category: "LOUCA_METAL" },
          { label: "Lavatório e cuba", category: "LOUCA_METAL" },
          { label: "Torneira e sifão", category: "LOUCA_METAL" },
          { label: "Chuveiro e registro", category: "HIDRAULICA" },
          { label: "Ralo e escoamento", category: "HIDRAULICA" },
          { label: "Teste de vazamento", category: "HIDRAULICA" },
          { label: "Box e vidros", category: "VIDRO" },
          { label: "Porta e ferragens", category: "PORTA" },
          { label: "Ventilação / exaustão", category: "ELETRICA" },
          { label: "Tomadas e iluminação", category: "ELETRICA" },
          { label: "Teto e forro", category: "FORRO_GESSO" },
        ],
      },
      {
        name: "Suíte",
        items: [...commonRoomItems, { label: "Ponto de ar-condicionado", category: "ELETRICA" }],
      },
      {
        name: "Banheiro da suíte",
        items: [
          { label: "Piso e caimento para o ralo", category: "PISO" },
          { label: "Revestimento de parede", category: "REVESTIMENTO" },
          { label: "Rejunte e cantos", category: "REVESTIMENTO" },
          { label: "Bacia sanitária", category: "LOUCA_METAL" },
          { label: "Lavatório e cuba", category: "LOUCA_METAL" },
          { label: "Torneira e sifão", category: "LOUCA_METAL" },
          { label: "Chuveiro e registro", category: "HIDRAULICA" },
          { label: "Teste de vazamento", category: "HIDRAULICA" },
          { label: "Box e vidros", category: "VIDRO" },
          { label: "Porta e ferragens", category: "PORTA" },
          { label: "Ventilação / exaustão", category: "ELETRICA" },
        ],
      },
      {
        name: "Quarto 1",
        items: [...commonRoomItems, { label: "Ponto de ar-condicionado", category: "ELETRICA" }],
      },
      {
        name: "Quarto 2",
        items: [...commonRoomItems, { label: "Ponto de ar-condicionado", category: "ELETRICA" }],
      },
      {
        name: "Varanda",
        items: [
          { label: "Piso e caimento", category: "PISO" },
          { label: "Ralo", category: "HIDRAULICA" },
          { label: "Guarda-corpo e fixação", category: "ESTRUTURA" },
          { label: "Vidros e esquadrias", category: "VIDRO" },
          { label: "Impermeabilização aparente", category: "IMPERMEABILIZACAO" },
          { label: "Ponto de churrasqueira / gás", category: "GAS" },
          { label: "Tomadas e iluminação", category: "ELETRICA" },
          { label: "Pintura e acabamento", category: "PINTURA" },
        ],
      },
      {
        name: "Itens gerais da unidade",
        items: [
          { label: "Medidor de água individual", category: "HIDRAULICA" },
          { label: "Medidor de gás", category: "GAS" },
          { label: "Pressão de água nos pontos", category: "HIDRAULICA" },
          { label: "Teste de todos os disjuntores", category: "ELETRICA" },
          { label: "Alinhamento e prumo de paredes", category: "ALVENARIA" },
          { label: "Fissuras aparentes", category: "ESTRUTURA" },
          { label: "Manual do proprietário entregue", category: "OUTRO" },
          { label: "Chaves e controles entregues", category: "OUTRO" },
        ],
      },
    ],
  },
  {
    name: "Entrega de chaves — Casa",
    propertyKind: "CASA",
    description: "Checklist para vistoria de entrega de casa, incluindo áreas externas.",
    serviceCode: "VIST-ENTREGA",
    isDefault: false,
    ratingScale: "ESTADO",
    rooms: [
      {
        name: "Fachada e área externa",
        items: [
          { label: "Pintura externa", category: "PINTURA" },
          { label: "Revestimento de fachada", category: "REVESTIMENTO" },
          { label: "Calçada e piso externo", category: "PISO" },
          { label: "Muro e portão", category: "ALVENARIA" },
          { label: "Caimento e drenagem", category: "HIDRAULICA" },
          { label: "Iluminação externa", category: "ELETRICA" },
          { label: "Caixa d'água e reservatório", category: "HIDRAULICA" },
        ],
      },
      { name: "Sala", items: commonRoomItems },
      {
        name: "Cozinha",
        items: [
          { label: "Piso", category: "PISO" },
          { label: "Revestimento de parede", category: "REVESTIMENTO" },
          { label: "Bancada e cuba", category: "LOUCA_METAL" },
          { label: "Pontos hidráulicos", category: "HIDRAULICA" },
          { label: "Ponto de gás", category: "GAS" },
          { label: "Tomadas e circuitos", category: "ELETRICA" },
        ],
      },
      {
        name: "Banheiro",
        items: [
          { label: "Piso e caimento para o ralo", category: "PISO" },
          { label: "Revestimento de parede", category: "REVESTIMENTO" },
          { label: "Louças e metais", category: "LOUCA_METAL" },
          { label: "Teste de vazamento", category: "HIDRAULICA" },
          { label: "Box e vidros", category: "VIDRO" },
        ],
      },
      { name: "Quarto 1", items: commonRoomItems },
      { name: "Quarto 2", items: commonRoomItems },
      {
        name: "Telhado e cobertura",
        items: [
          { label: "Telhas e alinhamento", category: "ESTRUTURA" },
          { label: "Calhas e rufos", category: "IMPERMEABILIZACAO" },
          { label: "Forro e sinais de infiltração", category: "FORRO_GESSO" },
        ],
      },
    ],
  },
  {
    name: "Vistoria de locação",
    propertyKind: "APARTAMENTO",
    description: "Checklist enxuto para registrar estado de conservação em locação.",
    serviceCode: "VIST-LOCACAO",
    isDefault: false,
    ratingScale: "ESTADO",
    rooms: [
      {
        name: "Sala",
        items: [
          { label: "Piso", category: "PISO" },
          { label: "Paredes e pintura", category: "PINTURA" },
          { label: "Esquadrias e vidros", category: "ESQUADRIA" },
          { label: "Elétrica", category: "ELETRICA" },
        ],
      },
      {
        name: "Cozinha",
        items: [
          { label: "Piso e revestimento", category: "REVESTIMENTO" },
          { label: "Bancada, cuba e torneira", category: "LOUCA_METAL" },
          { label: "Hidráulica e vazamentos", category: "HIDRAULICA" },
          { label: "Armários", category: "MARCENARIA" },
        ],
      },
      {
        name: "Banheiro",
        items: [
          { label: "Louças e metais", category: "LOUCA_METAL" },
          { label: "Revestimento e rejunte", category: "REVESTIMENTO" },
          { label: "Vazamentos", category: "HIDRAULICA" },
          { label: "Box", category: "VIDRO" },
        ],
      },
      {
        name: "Quartos",
        items: [
          { label: "Piso", category: "PISO" },
          { label: "Paredes e pintura", category: "PINTURA" },
          { label: "Esquadrias", category: "ESQUADRIA" },
          { label: "Armários", category: "MARCENARIA" },
        ],
      },
    ],
  },
];
