/**
 * Guarda de terminologia e habilitação profissional.
 *
 * O requisito é claro: o sistema não pode chamar de "laudo técnico" um
 * documento que exige registro em CREA/CAU se esse registro não existe. Isso
 * poderia ser um aviso na interface — e seria esquecido no primeiro documento
 * novo. Em vez disso, é uma função que a geração de PDF é obrigada a consultar:
 * quem decide o título, o rodapé e o aviso legal é este módulo, não o template.
 *
 * Não faz I/O e não importa nada além do vocabulário do domínio, para poder ser
 * testado isoladamente.
 */

import {
  CouncilType,
  DocumentKind,
  RESTRICTED_DOCUMENT_KINDS,
  RestrictionLevel,
} from "@/domain/enums";
import { documentKindLabels } from "@/domain/labels";

export type ProfessionalCredentials = {
  professionalName: string | null;
  professionalTitle: string | null;
  councilType: string;
  councilNumber: string | null;
  canIssueArt: boolean;
};

export type ServiceRules = {
  name: string;
  restrictionLevel: string;
  requiresTechnicalResponsible: boolean;
  requiresArtRrt: boolean;
  legalNotes: string | null;
  defaultDocumentKind: string | null;
};

export type DocumentResolution = {
  /** Tipo efetivamente permitido. Pode não ser o solicitado. */
  documentKind: DocumentKind;
  /** Título que vai na capa. */
  title: string;
  /** `true` quando o tipo pedido foi rebaixado por falta de habilitação. */
  downgraded: boolean;
  /** Explicação do rebaixamento, para mostrar na interface. */
  downgradeReason: string | null;
  /** Aviso legal obrigatório no rodapé do documento. Nunca vazio. */
  legalNotice: string;
  /** Avisos para o operador — aparecem na tela, não no PDF. */
  warnings: string[];
};

export type ServiceAvailability = {
  allowed: boolean;
  /** Pode prestar, mas com ressalva que precisa ser exibida. */
  requiresDisclosure: boolean;
  reason: string | null;
};

/** O profissional tem registro ativo em conselho? */
export function hasProfessionalRegistration(credentials: ProfessionalCredentials): boolean {
  return (
    credentials.councilType !== CouncilType.NENHUM &&
    Boolean(credentials.councilNumber?.trim())
  );
}

const BASE_NOTICE_UNREGISTERED =
  "Este documento é um registro descritivo e fotográfico das condições observadas na data " +
  "da vistoria. Não constitui laudo técnico, parecer técnico ou perícia, e não substitui " +
  "avaliação de profissional legalmente habilitado com registro em conselho de classe " +
  "(CREA/CAU) e respectiva ART/RRT.";

const BASE_NOTICE_REGISTERED = (credentials: ProfessionalCredentials) =>
  `Documento elaborado por ${credentials.professionalName ?? "responsável técnico"}` +
  `${credentials.professionalTitle ? `, ${credentials.professionalTitle}` : ""}` +
  `, ${credentials.councilType} ${credentials.councilNumber}.`;

/**
 * Decide qual documento pode ser emitido.
 *
 * Se o tipo pedido exige habilitação e ela não existe, o documento é rebaixado
 * para "Relatório de vistoria" em vez de a operação falhar — o trabalho já foi
 * feito e o cliente precisa receber algo. O que muda é o nome e o aviso.
 */
export function resolveDocument(input: {
  requestedKind: string | null;
  service: ServiceRules | null;
  credentials: ProfessionalCredentials;
}): DocumentResolution {
  const { service, credentials } = input;
  const registered = hasProfessionalRegistration(credentials);
  const warnings: string[] = [];

  const requested = normalizeKind(
    input.requestedKind ?? service?.defaultDocumentKind ?? DocumentKind.RELATORIO_VISTORIA,
  );

  const isRestricted = RESTRICTED_DOCUMENT_KINDS.includes(requested);
  let documentKind = requested;
  let downgraded = false;
  let downgradeReason: string | null = null;

  if (isRestricted && !registered) {
    documentKind = DocumentKind.RELATORIO_VISTORIA;
    downgraded = true;
    downgradeReason =
      `"${documentKindLabels[requested]}" exige profissional habilitado com registro em ` +
      `conselho de classe. O documento será emitido como "${documentKindLabels[documentKind]}".`;
  }

  if (isRestricted && registered && !credentials.canIssueArt) {
    warnings.push(
      "Este tipo de documento normalmente exige ART/RRT. Confirme o recolhimento antes de entregar.",
    );
  }

  if (service?.requiresArtRrt && !credentials.canIssueArt) {
    warnings.push(
      `O serviço "${service.name}" costuma exigir ART/RRT. Verifique se há responsável técnico designado.`,
    );
  }

  if (service?.requiresTechnicalResponsible && !registered) {
    warnings.push(
      `O serviço "${service.name}" prevê responsável técnico. Sem registro configurado, ` +
        "o documento sai como registro descritivo.",
    );
  }

  const noticeParts = [
    registered ? BASE_NOTICE_REGISTERED(credentials) : BASE_NOTICE_UNREGISTERED,
    service?.legalNotes ?? null,
  ].filter((part): part is string => Boolean(part));

  return {
    documentKind,
    title: documentKindLabels[documentKind],
    downgraded,
    downgradeReason,
    legalNotice: noticeParts.join(" "),
    warnings,
  };
}

/**
 * O serviço pode ser ofertado com a habilitação atual?
 *
 * Usado no catálogo e ao criar vistoria — melhor descobrir antes de vender do
 * que na hora de entregar o documento.
 */
export function checkServiceAvailability(
  service: ServiceRules,
  credentials: ProfessionalCredentials,
): ServiceAvailability {
  const registered = hasProfessionalRegistration(credentials);

  switch (service.restrictionLevel) {
    case RestrictionLevel.RESTRITO:
      return registered
        ? { allowed: true, requiresDisclosure: true, reason: service.legalNotes }
        : {
            allowed: false,
            requiresDisclosure: true,
            reason:
              "Este serviço exige profissional habilitado com registro em conselho de classe. " +
              "Configure o responsável técnico em Configurações para liberá-lo.",
          };

    case RestrictionLevel.REQUER_HABILITACAO:
      return {
        allowed: true,
        requiresDisclosure: true,
        reason:
          service.legalNotes ??
          "O documento formal deste serviço pode exigir responsável técnico habilitado.",
      };

    default:
      return { allowed: true, requiresDisclosure: false, reason: null };
  }
}

/** Tipos de documento que podem ser escolhidos com a habilitação atual. */
export function allowedDocumentKinds(credentials: ProfessionalCredentials): DocumentKind[] {
  const open: DocumentKind[] = [
    DocumentKind.RELATORIO_VISTORIA,
    DocumentKind.RELATORIO_FOTOGRAFICO,
    DocumentKind.CHECKLIST_ENTREGA,
    DocumentKind.RELATORIO_NAO_CONFORMIDADES,
    DocumentKind.RELATORIO_VISITA,
    DocumentKind.RELATORIO_ACOMPANHAMENTO,
  ];

  return hasProfessionalRegistration(credentials)
    ? [...open, ...RESTRICTED_DOCUMENT_KINDS]
    : open;
}

function normalizeKind(value: string): DocumentKind {
  return (Object.values(DocumentKind) as string[]).includes(value)
    ? (value as DocumentKind)
    : DocumentKind.RELATORIO_VISTORIA;
}
