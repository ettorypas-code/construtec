/**
 * Dinheiro é sempre `number` inteiro em CENTAVOS dentro do sistema.
 *
 * Motivo: orçamento aplica quantidade fracionária, perdas e BDI em cadeia.
 * Em ponto flutuante isso acumula divergência de centavos que aparece impressa
 * na proposta do cliente. Aqui todo arredondamento acontece em um lugar só.
 */

const CENTS_PER_UNIT = 100;

const brlFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const brlCompactFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  notation: "compact",
  maximumFractionDigits: 1,
});

const decimalFormatter = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Formata centavos como moeda brasileira: 123456 → "R$ 1.234,56". */
export function formatBRL(cents: number | null | undefined): string {
  return brlFormatter.format((cents ?? 0) / CENTS_PER_UNIT);
}

/** Versão curta para cartões de indicador: 1234567 → "R$ 12,3 mil". */
export function formatBRLCompact(cents: number | null | undefined): string {
  return brlCompactFormatter.format((cents ?? 0) / CENTS_PER_UNIT);
}

/** Centavos como número puro, sem símbolo: 123456 → "1.234,56". */
export function formatAmount(cents: number | null | undefined): string {
  return decimalFormatter.format((cents ?? 0) / CENTS_PER_UNIT);
}

/**
 * Converte o que o usuário digitou em centavos.
 * Aceita "1.234,56", "1234,56", "1234.56", "R$ 1.234,56" e "1234".
 * Retorna `null` quando não há número reconhecível.
 */
export function parseBRLToCents(input: string | number | null | undefined): number | null {
  if (input === null || input === undefined || input === "") return null;
  if (typeof input === "number") {
    return Number.isFinite(input) ? Math.round(input * CENTS_PER_UNIT) : null;
  }

  const cleaned = input.replace(/[^\d,.-]/g, "").trim();
  if (cleaned === "" || cleaned === "-") return null;

  const lastComma = cleaned.lastIndexOf(",");
  const lastDot = cleaned.lastIndexOf(".");
  const decimalSeparator = lastComma > lastDot ? "," : lastDot > lastComma ? "." : null;

  let normalized: string;
  if (decimalSeparator === null) {
    normalized = cleaned.replace(/[.,]/g, "");
  } else {
    const separatorIndex = decimalSeparator === "," ? lastComma : lastDot;
    const integerPart = cleaned.slice(0, separatorIndex).replace(/[.,]/g, "");
    const fractionPart = cleaned.slice(separatorIndex + 1).replace(/[.,]/g, "");
    normalized = `${integerPart}.${fractionPart}`;
  }

  const value = Number(normalized);
  return Number.isFinite(value) ? Math.round(value * CENTS_PER_UNIT) : null;
}

/** Reais (com decimais) → centavos. Use apenas em fronteira de importação. */
export function toCents(value: number): number {
  return Math.round(value * CENTS_PER_UNIT);
}

/** Centavos → reais com decimais. Use apenas para exportar/serializar. */
export function fromCents(cents: number): number {
  return cents / CENTS_PER_UNIT;
}

/** Multiplica centavos por uma quantidade fracionária, arredondando uma vez. */
export function multiplyCents(cents: number, quantity: number): number {
  return Math.round(cents * quantity);
}

/** Aplica um acréscimo percentual: applyPercent(10000, 25) → 12500. */
export function applyPercent(cents: number, percent: number): number {
  return Math.round(cents * (1 + percent / 100));
}

/** Devolve apenas a parcela do percentual: percentOf(10000, 25) → 2500. */
export function percentOf(cents: number, percent: number): number {
  return Math.round(cents * (percent / 100));
}

export function sumCents(values: Array<number | null | undefined>): number {
  return values.reduce<number>((total, value) => total + (value ?? 0), 0);
}

/** Margem sobre o preço de venda, em pontos percentuais. `null` se não há venda. */
export function marginPercent(costCents: number, saleCents: number): number | null {
  if (saleCents <= 0) return null;
  return ((saleCents - costCents) / saleCents) * 100;
}

export function formatPercent(value: number | null | undefined, digits = 1): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  return `${value.toFixed(digits).replace(".", ",")}%`;
}

/** Quantidades (m², m³, kg) usam decimal comum, não centavos. */
export function formatQuantity(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  }).format(value);
}

export function parseQuantity(input: string | number | null | undefined): number | null {
  if (input === null || input === undefined || input === "") return null;
  if (typeof input === "number") return Number.isFinite(input) ? input : null;
  const normalized = input.replace(/\./g, "").replace(",", ".").replace(/[^\d.-]/g, "");
  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}
