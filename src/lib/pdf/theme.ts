import { StyleSheet } from "@react-pdf/renderer";

/**
 * Estilos compartilhados dos documentos.
 *
 * `@react-pdf/renderer` não tem CSS completo: nada de grid, float ou seletor.
 * Tudo aqui é flexbox e valor absoluto — foi por isso que o layout dos
 * documentos foi desenhado em coluna. Ver ARQUITETURA.md, decisão D5.
 *
 * As cores repetem os tokens da interface para que o PDF pareça parte do mesmo
 * produto, e não um anexo gerado por outra ferramenta.
 */

export const pdfColors = {
  ink900: "#161615",
  ink800: "#262625",
  ink700: "#3d3d3b",
  ink600: "#52524f",
  ink500: "#6b6b67",
  ink400: "#8e8e8a",
  ink300: "#bfbfbc",
  ink200: "#dcdcda",
  ink100: "#ececeb",
  ink50: "#f6f6f5",
  brand: "#0e7c86",
  brandSoft: "#eefaf9",
  critical: "#b91c1c",
  criticalSoft: "#fef2f2",
  high: "#c2410c",
  highSoft: "#fff7ed",
  medium: "#a16207",
  mediumSoft: "#fefce8",
  low: "#475569",
  lowSoft: "#f1f5f9",
  white: "#ffffff",
} as const;

export const severityPdfColors: Record<string, { text: string; background: string }> = {
  CRITICA: { text: pdfColors.critical, background: pdfColors.criticalSoft },
  ALTA: { text: pdfColors.high, background: pdfColors.highSoft },
  MEDIA: { text: pdfColors.medium, background: pdfColors.mediumSoft },
  BAIXA: { text: pdfColors.low, background: pdfColors.lowSoft },
};

export const styles = StyleSheet.create({
  page: {
    paddingTop: 44,
    paddingBottom: 56,
    paddingHorizontal: 40,
    fontSize: 9.5,
    lineHeight: 1.5,
    color: pdfColors.ink800,
    fontFamily: "Helvetica",
  },

  /* Capa ---------------------------------------------------------------- */
  coverPage: {
    paddingTop: 64,
    paddingBottom: 56,
    paddingHorizontal: 44,
    fontSize: 10,
    color: pdfColors.ink800,
    fontFamily: "Helvetica",
  },
  coverBrand: {
    fontSize: 9,
    letterSpacing: 1.6,
    textTransform: "uppercase",
    color: pdfColors.brand,
    fontFamily: "Helvetica-Bold",
  },
  coverTitle: {
    marginTop: 18,
    fontSize: 26,
    lineHeight: 1.2,
    color: pdfColors.ink900,
    fontFamily: "Helvetica-Bold",
  },
  coverSubtitle: {
    marginTop: 8,
    fontSize: 11,
    color: pdfColors.ink500,
  },
  coverRule: {
    marginTop: 22,
    marginBottom: 22,
    height: 2,
    width: 56,
    backgroundColor: pdfColors.brand,
  },

  /* Blocos --------------------------------------------------------------- */
  sectionTitle: {
    fontSize: 8.5,
    letterSpacing: 1.1,
    textTransform: "uppercase",
    color: pdfColors.ink500,
    fontFamily: "Helvetica-Bold",
    marginBottom: 8,
  },
  roomTitle: {
    fontSize: 13,
    color: pdfColors.ink900,
    fontFamily: "Helvetica-Bold",
    marginBottom: 2,
  },
  card: {
    borderWidth: 1,
    borderColor: pdfColors.ink200,
    borderRadius: 4,
    padding: 12,
  },

  /* Linhas rótulo → valor ------------------------------------------------ */
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
    borderBottomWidth: 0.5,
    borderBottomColor: pdfColors.ink100,
  },
  rowLabel: { color: pdfColors.ink500, width: "38%" },
  rowValue: { color: pdfColors.ink900, width: "62%", textAlign: "right" },

  /* Selo ----------------------------------------------------------------- */
  badge: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 8,
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },

  /* Cabeçalho e rodapé fixos --------------------------------------------- */
  runningHeader: {
    position: "absolute",
    top: 20,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 7.5,
    color: pdfColors.ink400,
  },
  footer: {
    position: "absolute",
    bottom: 22,
    left: 40,
    right: 40,
  },
  footerRule: {
    height: 0.5,
    backgroundColor: pdfColors.ink200,
    marginBottom: 6,
  },
  footerText: {
    fontSize: 6.8,
    lineHeight: 1.45,
    color: pdfColors.ink400,
  },
  pageNumber: {
    position: "absolute",
    bottom: 22,
    right: 40,
    fontSize: 7.5,
    color: pdfColors.ink400,
  },
});
