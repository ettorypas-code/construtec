import { Document, Image, Page, Text, View } from "@react-pdf/renderer";
import { pdfColors, severityPdfColors, styles } from "./theme";
import {
  Badge,
  DocumentFooter,
  Divider,
  InfoRow,
  PageNumber,
  RunningHeader,
  SectionTitle,
} from "./primitives";
import { SEVERITY_ORDER, type Severity } from "@/domain/enums";
import { findingCategoryLabels, severityLabels } from "@/domain/labels";

/**
 * Relatório de vistoria.
 *
 * O título e o aviso legal NÃO são escolhidos aqui: chegam prontos, já
 * decididos por `lib/compliance` a partir do serviço e da habilitação
 * profissional. Este arquivo só desenha. Ver ARQUITETURA.md, decisão D6.
 */

export type ReportPhoto = {
  /** Bytes da imagem. Só JPEG e PNG chegam aqui. */
  data: Buffer;
  format: "jpg" | "png";
  caption: string | null;
};

export type ReportFinding = {
  index: number;
  title: string;
  description: string | null;
  category: string;
  severity: string;
  status: string;
  locationNote: string | null;
  photos: ReportPhoto[];
};

export type ReportRoom = {
  name: string;
  findings: ReportFinding[];
  checklist: Array<{
    label: string;
    status: string;
    photos: ReportPhoto[];
    /** Só em revistoria: como o item estava na vistoria conferida. */
    before?: { status: string; photos: ReportPhoto[] } | null;
  }>;
};

export type InspectionReportData = {
  documentTitle: string;
  reportNumber: string;
  legalNotice: string;
  company: {
    name: string;
    document: string | null;
    phone: string | null;
    email: string | null;
    professionalLine: string | null;
  };
  inspection: {
    code: string;
    title: string;
    clientName: string | null;
    propertyLabel: string | null;
    propertyAddress: string | null;
    serviceName: string | null;
    inspectedAt: string;
    inspectorName: string | null;
    contactName: string | null;
    summaryText: string | null;
  };
  severityTally: Record<Severity, number>;
  totalFindings: number;
  rooms: ReportRoom[];
  /** Itens de checklist ainda pendentes, listados ao final. */
  pendingChecklist: Array<{ room: string; label: string }>;
  showChecklist: boolean;
  /** Rótulos da escala usada nesta vistoria, para a tabela do checklist. */
  statusLabels: Record<string, string>;
  /** Total de fotos de estado (fora as de ocorrência). */
  itemPhotoCount: number;
  /** Preenchido só em revistoria: o código da vistoria que está sendo conferida. */
  revisitOf: string | null;
  /** Placar da conferência, para o resumo da revistoria. */
  correctionTally: { corrigido: number; parcial: number; naoCorrigido: number } | null;
};

export function InspectionReportDocument({ data }: { data: InspectionReportData }) {
  const runningLeft = `${data.documentTitle} · ${data.reportNumber}`;
  const runningRight = data.inspection.propertyLabel ?? data.inspection.title;

  return (
    <Document
      title={`${data.documentTitle} — ${data.reportNumber}`}
      author={data.company.name}
      subject={data.inspection.title}
    >
      {/* CAPA ------------------------------------------------------------ */}
      <Page size="A4" style={styles.coverPage}>
        <Text style={styles.coverBrand}>{data.company.name}</Text>
        <Text style={styles.coverTitle}>{data.documentTitle}</Text>
        <Text style={styles.coverSubtitle}>{data.inspection.title}</Text>
        <View style={styles.coverRule} />

        <View style={{ marginBottom: 24 }}>
          <InfoRow label="Documento nº" value={data.reportNumber} />
          <InfoRow label="Vistoria nº" value={data.inspection.code} />
          <InfoRow label="Cliente" value={data.inspection.clientName} />
          <InfoRow label="Empreendimento / unidade" value={data.inspection.propertyLabel} />
          <InfoRow label="Endereço" value={data.inspection.propertyAddress} />
          <InfoRow label="Serviço" value={data.inspection.serviceName} />
          <InfoRow label="Data da vistoria" value={data.inspection.inspectedAt} />
          <InfoRow label="Responsável pela vistoria" value={data.inspection.inspectorName} />
          <InfoRow label="Acompanhado por" value={data.inspection.contactName} />
        </View>

        {/* Numa revistoria o placar vem primeiro. É a única linha que a
            construtora vai ler com atenção, e é o que o cliente usa para
            cobrar: destes pontos, tantos continuam abertos. */}
        {data.correctionTally ? (
          <>
            <SectionTitle>Resultado da conferência</SectionTitle>
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
              {(
                [
                  ["Corrigidos", data.correctionTally.corrigido, pdfColors.brand],
                  ["Corrigidos em parte", data.correctionTally.parcial, pdfColors.medium],
                  ["Não corrigidos", data.correctionTally.naoCorrigido, pdfColors.critical],
                ] as const
              ).map(([label, count, color]) => (
                <View
                  key={label}
                  style={{
                    flex: 1,
                    borderWidth: 1,
                    borderColor: count > 0 ? color : pdfColors.ink200,
                    borderRadius: 4,
                    paddingVertical: 10,
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 20,
                      fontFamily: "Helvetica-Bold",
                      color: count > 0 ? color : pdfColors.ink300,
                    }}
                  >
                    {count}
                  </Text>
                  <Text
                    style={{
                      marginTop: 3,
                      fontSize: 7,
                      letterSpacing: 0.6,
                      textTransform: "uppercase",
                      color: count > 0 ? color : pdfColors.ink400,
                      textAlign: "center",
                    }}
                  >
                    {label}
                  </Text>
                </View>
              ))}
            </View>
            <Text style={{ fontSize: 10, color: pdfColors.ink600, marginBottom: 18 }}>
              {data.correctionTally.parcial + data.correctionTally.naoCorrigido === 0
                ? `Todos os pontos apontados em ${data.revisitOf} foram corrigidos.`
                : `Dos pontos apontados em ${data.revisitOf}, ` +
                  `${data.correctionTally.parcial + data.correctionTally.naoCorrigido} ` +
                  "seguem pendentes de correção integral."}
            </Text>
          </>
        ) : null}

        <SectionTitle>Resumo das não conformidades</SectionTitle>
        <View style={{ flexDirection: "row", gap: 8, marginBottom: 18 }}>
          {SEVERITY_ORDER.map((severity) => {
            const tone = severityPdfColors[severity];
            const count = data.severityTally[severity];
            return (
              <View
                key={severity}
                style={{
                  flex: 1,
                  borderWidth: 1,
                  borderColor: count > 0 ? tone.text : pdfColors.ink200,
                  backgroundColor: count > 0 ? tone.background : pdfColors.white,
                  borderRadius: 4,
                  paddingVertical: 10,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    fontSize: 20,
                    fontFamily: "Helvetica-Bold",
                    color: count > 0 ? tone.text : pdfColors.ink300,
                  }}
                >
                  {count}
                </Text>
                <Text
                  style={{
                    marginTop: 3,
                    fontSize: 7,
                    letterSpacing: 0.6,
                    textTransform: "uppercase",
                    color: count > 0 ? tone.text : pdfColors.ink400,
                  }}
                >
                  {severityLabels[severity]}
                </Text>
              </View>
            );
          })}
        </View>

        <Text style={{ fontSize: 10, color: pdfColors.ink600 }}>
          {data.totalFindings === 0
            ? "Nenhuma não conformidade registrada nesta vistoria."
            : `Foram registradas ${data.totalFindings} não conformidades, distribuídas em ${data.rooms.filter((room) => room.findings.length > 0).length} ambientes.`}
          {data.itemPhotoCount > 0
            ? ` O documento inclui ${data.itemPhotoCount} fotografias de estado dos itens verificados.`
            : ""}
        </Text>

        {data.inspection.summaryText ? (
          <View style={{ marginTop: 18 }}>
            <SectionTitle>Observações gerais</SectionTitle>
            <Text style={{ fontSize: 9.5, lineHeight: 1.6, color: pdfColors.ink700 }}>
              {data.inspection.summaryText}
            </Text>
          </View>
        ) : null}

        <View style={{ position: "absolute", bottom: 56, left: 44, right: 44 }}>
          <View style={{ height: 0.5, backgroundColor: pdfColors.ink200, marginBottom: 8 }} />
          <Text style={{ fontSize: 7.5, lineHeight: 1.5, color: pdfColors.ink500 }}>
            {data.legalNotice}
          </Text>
          <Text style={{ marginTop: 6, fontSize: 7.5, color: pdfColors.ink400 }}>
            {[
              data.company.name,
              data.company.document,
              data.company.phone,
              data.company.email,
              data.company.professionalLine,
            ]
              .filter(Boolean)
              .join("  ·  ")}
          </Text>
        </View>
      </Page>

      {/* AMBIENTES ------------------------------------------------------- */}
      {data.rooms.some((room) => room.findings.length > 0) ? (
        <Page size="A4" style={styles.page}>
          <RunningHeader left={runningLeft} right={runningRight} />

          <SectionTitle>Não conformidades por ambiente</SectionTitle>

          {data.rooms
            .filter((room) => room.findings.length > 0)
            .map((room) => (
              <View key={room.name} style={{ marginBottom: 18 }} wrap>
                <View
                  style={{
                    backgroundColor: pdfColors.ink50,
                    paddingVertical: 6,
                    paddingHorizontal: 10,
                    borderRadius: 4,
                    marginBottom: 10,
                  }}
                >
                  <Text style={styles.roomTitle}>{room.name}</Text>
                  <Text style={{ fontSize: 8, color: pdfColors.ink500 }}>
                    {room.findings.length}{" "}
                    {room.findings.length === 1 ? "ocorrência" : "ocorrências"}
                  </Text>
                </View>

                {room.findings.map((finding) => (
                  <FindingBlock key={finding.index} finding={finding} />
                ))}
              </View>
            ))}

          <DocumentFooter
            legalNotice={data.legalNotice}
            companyName={data.company.name}
          />
          <PageNumber />
        </Page>
      ) : null}

      {/* CHECKLIST E ENCERRAMENTO ---------------------------------------- */}
      <Page size="A4" style={styles.page}>
        <RunningHeader left={runningLeft} right={runningRight} />

        {data.showChecklist ? (
          <View style={{ marginBottom: 22 }}>
            <SectionTitle>
              {data.revisitOf
                ? "Conferência item a item"
                : "Estado verificado por item"}
            </SectionTitle>
            {data.revisitOf ? (
              <Text style={{ fontSize: 9, color: pdfColors.ink600, marginBottom: 6 }}>
                Cada linha traz como o item estava em {data.revisitOf} e como foi
                encontrado nesta conferência.
              </Text>
            ) : null}
            {data.rooms.map((room) => (
              <View key={room.name} style={{ marginBottom: 12 }} wrap>
                <Text
                  style={{
                    fontSize: 9.5,
                    fontFamily: "Helvetica-Bold",
                    color: pdfColors.ink800,
                    marginBottom: 3,
                  }}
                >
                  {room.name}
                </Text>
                {room.checklist.map((item) => (
                  <View key={item.label} wrap={false}>
                    <View style={styles.row}>
                      <Text style={{ color: pdfColors.ink700, width: "70%" }}>
                        {item.label}
                        {item.photos.length > 0 ? (
                          <Text style={{ color: pdfColors.ink400 }}>
                            {"  "}
                            {item.photos.length} foto{item.photos.length > 1 ? "s" : ""}
                          </Text>
                        ) : null}
                      </Text>
                      <Text
                        style={{
                          width: "30%",
                          textAlign: "right",
                          color: checklistColor(item.status),
                        }}
                      >
                        {item.before ? (
                          <Text style={{ color: pdfColors.ink400 }}>
                            {data.statusLabels[item.before.status] ?? item.before.status}
                            {/* WinAnsi, que e a codificacao da Helvetica embutida
                                aqui, nao tem a seta U+2192: ela sai como vazio e
                                o leitor ve dois estados soltos lado a lado. */}
                            {"  »  "}
                          </Text>
                        ) : null}
                        {data.statusLabels[item.status] ?? item.status}
                      </Text>
                    </View>

                    {/* Antes e depois lado a lado. Duas fileiras separadas
                        deixariam o leitor cruzando a página para comparar —
                        e comparar é o único motivo deste documento existir. */}
                    {item.before && item.before.photos.length > 0 ? (
                      <View style={{ flexDirection: "row", gap: 8, marginTop: 4 }}>
                        <View>
                          <Text
                            style={{ fontSize: 7.5, color: pdfColors.ink400, marginBottom: 2 }}
                          >
                            ANTES
                          </Text>
                          <View style={{ flexDirection: "row", gap: 4 }}>
                            {item.before.photos.map((photo, index) => (
                              // eslint-disable-next-line jsx-a11y/alt-text
                              <Image
                                key={index}
                                src={{ data: photo.data, format: photo.format }}
                                style={comparisonPhoto}
                              />
                            ))}
                          </View>
                        </View>

                        {item.photos.length > 0 ? (
                          <View>
                            <Text
                              style={{ fontSize: 7.5, color: pdfColors.ink400, marginBottom: 2 }}
                            >
                              DEPOIS
                            </Text>
                            <View style={{ flexDirection: "row", gap: 4 }}>
                              {item.photos.map((photo, index) => (
                                // eslint-disable-next-line jsx-a11y/alt-text
                                <Image
                                  key={index}
                                  src={{ data: photo.data, format: photo.format }}
                                  style={comparisonPhoto}
                                />
                              ))}
                            </View>
                          </View>
                        ) : null}
                      </View>
                    ) : null}

                    {item.photos.length > 0 &&
                    !(item.before && item.before.photos.length > 0) ? (
                      <View
                        style={{
                          flexDirection: "row",
                          flexWrap: "wrap",
                          gap: 4,
                          marginTop: 4,
                          marginBottom: 6,
                        }}
                      >
                        {item.photos.map((photo, index) => (
                          // eslint-disable-next-line jsx-a11y/alt-text
                          <Image
                            key={index}
                            src={{ data: photo.data, format: photo.format }}
                            style={{
                              width: 96,
                              height: 72,
                              objectFit: "cover",
                              borderWidth: 1,
                              borderColor: pdfColors.ink200,
                              borderRadius: 2,
                            }}
                          />
                        ))}
                      </View>
                    ) : null}
                  </View>
                ))}
              </View>
            ))}
          </View>
        ) : null}

        {data.pendingChecklist.length > 0 ? (
          <View style={{ marginBottom: 22 }}>
            <SectionTitle>Itens não verificados</SectionTitle>
            <Text style={{ fontSize: 9, color: pdfColors.ink600, marginBottom: 6 }}>
              Os itens abaixo não foram verificados na data desta vistoria.
            </Text>
            {data.pendingChecklist.map((item, index) => (
              <Text key={index} style={{ fontSize: 9, color: pdfColors.ink700 }}>
                • {item.room} — {item.label}
              </Text>
            ))}
          </View>
        ) : null}

        <Divider />

        <SectionTitle>Encerramento</SectionTitle>
        <Text style={{ fontSize: 9.5, lineHeight: 1.6, color: pdfColors.ink700 }}>
          Este documento foi emitido em {data.inspection.inspectedAt} e reflete as condições
          observadas no imóvel naquela data. As não conformidades listadas destinam-se à
          apresentação ao responsável pela execução para providências de correção.
        </Text>

        <View style={{ marginTop: 56, flexDirection: "row", gap: 32 }}>
          <SignatureLine
            label="Responsável pela vistoria"
            name={data.inspection.inspectorName ?? data.company.name}
          />
          <SignatureLine label="Cliente / acompanhante" name={data.inspection.contactName} />
        </View>

        <DocumentFooter legalNotice={data.legalNotice} companyName={data.company.name} />
        <PageNumber />
      </Page>
    </Document>
  );
}

/* -------------------------------------------------------------------------- */

function FindingBlock({ finding }: { finding: ReportFinding }) {
  const tone = severityPdfColors[finding.severity] ?? severityPdfColors.MEDIA;

  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: pdfColors.ink200,
        borderRadius: 4,
        padding: 10,
        marginBottom: 8,
      }}
      wrap={false}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 4,
        }}
      >
        <Text
          style={{
            fontSize: 10.5,
            fontFamily: "Helvetica-Bold",
            color: pdfColors.ink900,
            width: "78%",
          }}
        >
          {String(finding.index).padStart(2, "0")}. {finding.title}
        </Text>
        <Badge color={tone.text} background={tone.background}>
          {severityLabels[finding.severity as Severity] ?? finding.severity}
        </Badge>
      </View>

      <Text style={{ fontSize: 8, color: pdfColors.ink500, marginBottom: 4 }}>
        {[
          findingCategoryLabels[finding.category as keyof typeof findingCategoryLabels] ??
            finding.category,
          finding.locationNote,
        ]
          .filter(Boolean)
          .join(" · ")}
      </Text>

      {finding.description ? (
        <Text style={{ fontSize: 9.5, lineHeight: 1.55, color: pdfColors.ink700 }}>
          {finding.description}
        </Text>
      ) : null}

      {finding.photos.length > 0 ? (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
          {finding.photos.map((photo, index) => (
            /* `Image` aqui é o do @react-pdf/renderer, não o do DOM: não existe
               atributo alt em PDF. */
            // eslint-disable-next-line jsx-a11y/alt-text
            <Image
              key={index}
              src={{ data: photo.data, format: photo.format }}
              style={{
                width: 152,
                height: 114,
                objectFit: "cover",
                borderWidth: 1,
                borderColor: pdfColors.ink200,
                borderRadius: 3,
              }}
            />
          ))}
        </View>
      ) : null}

      <View style={{ flexDirection: "row", gap: 14, marginTop: 8 }}>
        <Checkbox label="Pendente" checked={finding.status === "PENDENTE"} />
        <Checkbox label="Corrigido" checked={finding.status === "CORRIGIDO"} />
        <Checkbox label="Reprovado" checked={finding.status === "REPROVADO"} />
      </View>
    </View>
  );
}

function Checkbox({ label, checked }: { label: string; checked: boolean }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
      <View
        style={{
          width: 8,
          height: 8,
          borderWidth: 1,
          borderColor: checked ? pdfColors.ink800 : pdfColors.ink300,
          backgroundColor: checked ? pdfColors.ink800 : pdfColors.white,
          borderRadius: 1.5,
        }}
      />
      <Text style={{ fontSize: 8, color: checked ? pdfColors.ink800 : pdfColors.ink400 }}>
        {label}
      </Text>
    </View>
  );
}

function SignatureLine({ label, name }: { label: string; name: string | null }) {
  return (
    <View style={{ flex: 1 }}>
      <View style={{ height: 0.8, backgroundColor: pdfColors.ink400, marginBottom: 5 }} />
      <Text style={{ fontSize: 8.5, color: pdfColors.ink800 }}>{name ?? " "}</Text>
      <Text style={{ fontSize: 7.5, color: pdfColors.ink500 }}>{label}</Text>
    </View>
  );
}

const comparisonPhoto = {
  width: 84,
  height: 63,
  objectFit: "cover" as const,
  borderWidth: 1,
  borderColor: pdfColors.ink200,
  borderRadius: 2,
};

function checklistColor(status: string): string {
  switch (status) {
    case "OK":
    case "NOVO":
      return pdfColors.ink600;
    case "BOM":
      return pdfColors.brand;
    case "REGULAR":
      return pdfColors.medium;
    case "RUIM":
      return pdfColors.high;
    case "CORRIGIDO":
      return pdfColors.brand;
    case "CORRIGIDO_PARCIAL":
      return pdfColors.medium;
    case "NAO_CONFORME":
    case "PESSIMO":
    case "NAO_CORRIGIDO":
      return pdfColors.critical;
    case "NAO_APLICAVEL":
      return pdfColors.ink400;
    default:
      return pdfColors.medium;
  }
}
