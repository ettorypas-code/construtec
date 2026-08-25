import {
  addDays,
  differenceInCalendarDays,
  endOfDay,
  endOfMonth,
  endOfWeek,
  format,
  isAfter,
  isBefore,
  isSameDay,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ptBR } from "date-fns/locale";

const locale = { locale: ptBR };

export function formatDate(value: Date | string | null | undefined): string {
  const date = coerce(value);
  return date ? format(date, "dd/MM/yyyy", locale) : "—";
}

export function formatDateTime(value: Date | string | null | undefined): string {
  const date = coerce(value);
  return date ? format(date, "dd/MM/yyyy 'às' HH:mm", locale) : "—";
}

export function formatTime(value: Date | string | null | undefined): string {
  const date = coerce(value);
  return date ? format(date, "HH:mm", locale) : "—";
}

export function formatDayLabel(value: Date | string | null | undefined): string {
  const date = coerce(value);
  return date ? format(date, "EEEE, d 'de' MMMM", locale) : "—";
}

export function formatMonthLabel(value: Date | string | null | undefined): string {
  const date = coerce(value);
  return date ? format(date, "MMMM 'de' yyyy", locale) : "—";
}

/** Valor para `<input type="date">`. */
export function toDateInput(value: Date | string | null | undefined): string {
  const date = coerce(value);
  return date ? format(date, "yyyy-MM-dd") : "";
}

/** Valor para `<input type="datetime-local">`. */
export function toDateTimeInput(value: Date | string | null | undefined): string {
  const date = coerce(value);
  return date ? format(date, "yyyy-MM-dd'T'HH:mm") : "";
}

/** "hoje", "amanhã", "há 3 dias", "em 5 dias". */
export function relativeDayLabel(value: Date | string | null | undefined): string {
  const date = coerce(value);
  if (!date) return "—";
  const days = differenceInCalendarDays(startOfDay(date), startOfDay(new Date()));
  if (days === 0) return "hoje";
  if (days === 1) return "amanhã";
  if (days === -1) return "ontem";
  if (days > 0) return `em ${days} dias`;
  return `há ${Math.abs(days)} dias`;
}

export function isOverdue(due: Date | string | null | undefined): boolean {
  const date = coerce(due);
  return date ? isBefore(endOfDay(date), new Date()) : false;
}

export function monthRange(reference: Date): { start: Date; end: Date } {
  return { start: startOfMonth(reference), end: endOfMonth(reference) };
}

export function weekRange(reference: Date): { start: Date; end: Date } {
  return {
    start: startOfWeek(reference, { weekStartsOn: 0 }),
    end: endOfWeek(reference, { weekStartsOn: 0 }),
  };
}

export function dayRange(reference: Date): { start: Date; end: Date } {
  return { start: startOfDay(reference), end: endOfDay(reference) };
}

/** "2026-08" → Date do primeiro dia do mês. Inválido cai no mês corrente. */
export function parseMonthParam(value: string | null | undefined): Date {
  if (!value) return startOfMonth(new Date());
  const parsed = parseISO(`${value}-01`);
  return Number.isNaN(parsed.getTime()) ? startOfMonth(new Date()) : startOfMonth(parsed);
}

export function toMonthParam(value: Date): string {
  return format(value, "yyyy-MM");
}

function coerce(value: Date | string | null | undefined): Date | null {
  if (!value) return null;
  const date = typeof value === "string" ? parseISO(value) : value;
  return Number.isNaN(date.getTime()) ? null : date;
}

export { addDays, isSameDay, isAfter, isBefore, startOfDay, endOfDay, startOfMonth, endOfMonth };
