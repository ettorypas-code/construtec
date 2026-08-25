import { Text, View } from "@react-pdf/renderer";
import { pdfColors, styles } from "./theme";

/** Linha rótulo → valor. Some quando não há valor, para não deixar buraco. */
export function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

export function Badge({
  children,
  color,
  background,
}: {
  children: string;
  color: string;
  background: string;
}) {
  return (
    <Text style={[styles.badge, { color, backgroundColor: background }]}>{children}</Text>
  );
}

export function SectionTitle({ children }: { children: string }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

export function Divider({ marginVertical = 12 }: { marginVertical?: number }) {
  return (
    <View
      style={{ height: 0.5, backgroundColor: pdfColors.ink200, marginVertical }}
    />
  );
}

/** Rodapé fixo com o aviso legal. Aparece em toda página, por exigência do domínio. */
export function DocumentFooter({
  legalNotice,
  companyName,
}: {
  legalNotice: string;
  companyName: string;
}) {
  return (
    <View style={styles.footer} fixed>
      <View style={styles.footerRule} />
      <Text style={styles.footerText}>{legalNotice}</Text>
      <Text style={[styles.footerText, { marginTop: 3 }]}>{companyName}</Text>
    </View>
  );
}

export function RunningHeader({ left, right }: { left: string; right: string }) {
  return (
    <View style={styles.runningHeader} fixed>
      <Text>{left}</Text>
      <Text>{right}</Text>
    </View>
  );
}

export function PageNumber() {
  return (
    <Text
      style={styles.pageNumber}
      fixed
      render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
    />
  );
}
