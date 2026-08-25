import { Document, Page, Text, View } from "@react-pdf/renderer";
import { pdfColors, styles } from "./theme";
import { DocumentFooter, InfoRow, PageNumber, RunningHeader, SectionTitle } from "./primitives";
import { formatBRL, formatQuantity } from "@/lib/utils/money";
import { unitLabels } from "@/domain/labels";
import type { Unit } from "@/domain/enums";

export type ProposalPdfData = {
  number: string;
  title: string;
  issuedAt: string;
  validUntil: string | null;
  company: {
    name: string;
    document: string | null;
    phone: string | null;
    email: string | null;
    website: string | null;
    address: string | null;
    professionalLine: string | null;
  };
  clientName: string;
  clientDocument: string | null;
  clientAddress: string | null;
  serviceName: string | null;
  scopeText: string | null;
  exclusionsText: string | null;
  deadlineText: string | null;
  paymentTerms: string | null;
  notes: string | null;
  legalNotice: string | null;
  items: Array<{
    description: string;
    detail: string | null;
    unit: string;
    quantity: number;
    unitPriceCents: number;
    totalCents: number;
  }>;
  subtotalCents: number;
  discountCents: number;
  totalCents: number;
};

const columns = {
  description: "46%",
  unit: "10%",
  quantity: "12%",
  unitPrice: "16%",
  total: "16%",
} as const;

export function ProposalDocument({ data }: { data: ProposalPdfData }) {
  return (
    <Document title={`Proposta ${data.number}`} author={data.company.name} subject={data.title}>
      <Page size="A4" style={styles.page}>
        <RunningHeader left={`Proposta ${data.number}`} right={data.clientName} />

        {/* Cabeçalho ---------------------------------------------------- */}
        <View style={{ marginBottom: 18 }}>
          <Text style={styles.coverBrand}>{data.company.name}</Text>
          <Text style={{ marginTop: 10, fontSize: 20, fontFamily: "Helvetica-Bold", color: pdfColors.ink900 }}>
            Proposta comercial
          </Text>
          <Text style={{ marginTop: 3, fontSize: 11, color: pdfColors.ink500 }}>{data.title}</Text>
          <View style={{ marginTop: 12, height: 2, width: 48, backgroundColor: pdfColors.brand }} />
        </View>

        <View style={{ flexDirection: "row", gap: 18, marginBottom: 18 }}>
          <View style={{ flex: 1 }}>
            <SectionTitle>Contratada</SectionTitle>
            <Text style={{ fontFamily: "Helvetica-Bold", color: pdfColors.ink900 }}>
              {data.company.name}
            </Text>
            {[
              data.company.document,
              data.company.address,
              data.company.phone,
              data.company.email,
              data.company.website,
              data.company.professionalLine,
            ]
              .filter(Boolean)
              .map((line, index) => (
                <Text key={index} style={{ fontSize: 9, color: pdfColors.ink600 }}>
                  {line}
                </Text>
              ))}
          </View>

          <View style={{ flex: 1 }}>
            <SectionTitle>Cliente</SectionTitle>
            <Text style={{ fontFamily: "Helvetica-Bold", color: pdfColors.ink900 }}>
              {data.clientName}
            </Text>
            {[data.clientDocument, data.clientAddress].filter(Boolean).map((line, index) => (
              <Text key={index} style={{ fontSize: 9, color: pdfColors.ink600 }}>
                {line}
              </Text>
            ))}
          </View>
        </View>

        <View style={{ marginBottom: 18 }}>
          <InfoRow label="Proposta nº" value={data.number} />
          <InfoRow label="Data de emissão" value={data.issuedAt} />
          <InfoRow label="Válida até" value={data.validUntil} />
          <InfoRow label="Serviço" value={data.serviceName} />
          <InfoRow label="Prazo de execução" value={data.deadlineText} />
        </View>

        {/* Escopo -------------------------------------------------------- */}
        {data.scopeText ? (
          <View style={{ marginBottom: 18 }}>
            <SectionTitle>Escopo do serviço</SectionTitle>
            <Text style={{ fontSize: 9.5, lineHeight: 1.6, color: pdfColors.ink700 }}>
              {data.scopeText}
            </Text>
          </View>
        ) : null}

        {/* Itens --------------------------------------------------------- */}
        <View style={{ marginBottom: 18 }}>
          <SectionTitle>Itens</SectionTitle>

          <View
            style={{
              flexDirection: "row",
              backgroundColor: pdfColors.ink50,
              paddingVertical: 5,
              paddingHorizontal: 6,
              borderRadius: 3,
            }}
          >
            <Text style={[headerCell, { width: columns.description }]}>Descrição</Text>
            <Text style={[headerCell, { width: columns.unit, textAlign: "center" }]}>Un.</Text>
            <Text style={[headerCell, { width: columns.quantity, textAlign: "right" }]}>Qtd.</Text>
            <Text style={[headerCell, { width: columns.unitPrice, textAlign: "right" }]}>
              Valor un.
            </Text>
            <Text style={[headerCell, { width: columns.total, textAlign: "right" }]}>Total</Text>
          </View>

          {data.items.map((item, index) => (
            <View
              key={index}
              style={{
                flexDirection: "row",
                paddingVertical: 6,
                paddingHorizontal: 6,
                borderBottomWidth: 0.5,
                borderBottomColor: pdfColors.ink100,
              }}
              wrap={false}
            >
              <View style={{ width: columns.description }}>
                <Text style={{ fontSize: 9, color: pdfColors.ink900 }}>{item.description}</Text>
                {item.detail ? (
                  <Text style={{ fontSize: 7.5, color: pdfColors.ink500 }}>{item.detail}</Text>
                ) : null}
              </View>
              <Text style={[bodyCell, { width: columns.unit, textAlign: "center" }]}>
                {unitLabels[item.unit as Unit] ?? item.unit}
              </Text>
              <Text style={[bodyCell, { width: columns.quantity, textAlign: "right" }]}>
                {formatQuantity(item.quantity)}
              </Text>
              <Text style={[bodyCell, { width: columns.unitPrice, textAlign: "right" }]}>
                {formatBRL(item.unitPriceCents)}
              </Text>
              <Text
                style={[
                  bodyCell,
                  { width: columns.total, textAlign: "right", fontFamily: "Helvetica-Bold" },
                ]}
              >
                {formatBRL(item.totalCents)}
              </Text>
            </View>
          ))}

          <View style={{ marginTop: 10, alignItems: "flex-end" }}>
            <View style={{ width: "52%" }}>
              <TotalRow label="Subtotal" value={formatBRL(data.subtotalCents)} />
              {data.discountCents > 0 ? (
                <TotalRow label="Desconto" value={`− ${formatBRL(data.discountCents)}`} />
              ) : null}
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginTop: 6,
                  paddingTop: 6,
                  borderTopWidth: 1,
                  borderTopColor: pdfColors.ink800,
                }}
              >
                <Text style={{ fontSize: 11, fontFamily: "Helvetica-Bold", color: pdfColors.ink900 }}>
                  Total
                </Text>
                <Text style={{ fontSize: 13, fontFamily: "Helvetica-Bold", color: pdfColors.brand }}>
                  {formatBRL(data.totalCents)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {data.paymentTerms ? (
          <Block title="Condições de pagamento" text={data.paymentTerms} />
        ) : null}
        {data.exclusionsText ? <Block title="Não incluso" text={data.exclusionsText} /> : null}
        {data.notes ? <Block title="Observações" text={data.notes} /> : null}
        {data.legalNotice ? <Block title="Observação legal" text={data.legalNotice} /> : null}

        <View style={{ marginTop: 42, flexDirection: "row", gap: 32 }} wrap={false}>
          <Signature label="Pela contratada" name={data.company.name} />
          <Signature label="De acordo — cliente" name={data.clientName} />
        </View>

        <DocumentFooter
          legalNotice={`Proposta ${data.number}${data.validUntil ? ` · válida até ${data.validUntil}` : ""}.`}
          companyName={[data.company.name, data.company.phone, data.company.email]
            .filter(Boolean)
            .join("  ·  ")}
        />
        <PageNumber />
      </Page>
    </Document>
  );
}

const headerCell = {
  fontSize: 7.5,
  letterSpacing: 0.5,
  textTransform: "uppercase" as const,
  color: pdfColors.ink500,
  fontFamily: "Helvetica-Bold",
};

const bodyCell = { fontSize: 9, color: pdfColors.ink700 };

function TotalRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 2 }}>
      <Text style={{ fontSize: 9.5, color: pdfColors.ink500 }}>{label}</Text>
      <Text style={{ fontSize: 9.5, color: pdfColors.ink800 }}>{value}</Text>
    </View>
  );
}

function Block({ title, text }: { title: string; text: string }) {
  return (
    <View style={{ marginBottom: 14 }} wrap={false}>
      <SectionTitle>{title}</SectionTitle>
      <Text style={{ fontSize: 9.5, lineHeight: 1.6, color: pdfColors.ink700 }}>{text}</Text>
    </View>
  );
}

function Signature({ label, name }: { label: string; name: string }) {
  return (
    <View style={{ flex: 1 }}>
      <View style={{ height: 0.8, backgroundColor: pdfColors.ink400, marginBottom: 5 }} />
      <Text style={{ fontSize: 8.5, color: pdfColors.ink800 }}>{name}</Text>
      <Text style={{ fontSize: 7.5, color: pdfColors.ink500 }}>{label}</Text>
    </View>
  );
}
