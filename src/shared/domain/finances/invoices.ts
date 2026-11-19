import { addDays, daysBetween } from "../dates";
import { sumByCurrency } from "../money";
import type { Currency, MoneyTotal } from "../money";

export const INVOICE_STATUSES = ["draft", "sent", "paid", "void"] as const;

export type StoredInvoiceStatus = (typeof INVOICE_STATUSES)[number];

/** What the UI shows: the stored status, with `overdue` derived for late sent invoices. */
export type InvoiceStatus = StoredInvoiceStatus | "overdue";

export const INVOICE_NUMBER_FORMATS = ["YYYY-NNN", "YYYY/NNN", "NNN"] as const;

export type InvoiceNumberFormat = (typeof INVOICE_NUMBER_FORMATS)[number];

export const DEFAULT_PAYMENT_TERMS_DAYS = 30;

export interface InvoiceStatusResult {
  status: InvoiceStatus;
  /** Days past the due date (0 unless overdue). */
  daysOverdue: number;
}

/** Overdue is never stored: a sent invoice whose due date is before `today`. */
export const invoiceStatus = (
  invoice: { status: StoredInvoiceStatus; dueDate: string },
  today: string
): InvoiceStatusResult => {
  if (invoice.status === "sent" && invoice.dueDate < today) {
    return {
      daysOverdue: daysBetween(invoice.dueDate, today),
      status: "overdue",
    };
  }

  return { daysOverdue: 0, status: invoice.status };
};

const SEQ_DIGITS = 3;

const PATTERNS: Record<InvoiceNumberFormat, RegExp> = {
  NNN: /^(?<seq>\d+)$/u,
  "YYYY-NNN": /^(?<year>\d{4})-(?<seq>\d+)$/u,
  "YYYY/NNN": /^(?<year>\d{4})\/(?<seq>\d+)$/u,
};

/**
 * The suggested next number: the highest sequence of `year` (any year for `NNN`) plus one,
 * zero-padded to three digits, e.g. `2026-015`. Numbers in other shapes are ignored.
 */
export const nextInvoiceNumber = (
  existing: readonly string[],
  year: number,
  format: InvoiceNumberFormat = "YYYY-NNN"
): string => {
  const pattern = PATTERNS[format];
  let highest = 0;

  for (const number of existing) {
    const groups = pattern.exec(number.trim())?.groups;
    const sameYear = format === "NNN" || groups?.year === String(year);

    if (groups?.seq !== undefined && sameYear) {
      highest = Math.max(highest, Number(groups.seq));
    }
  }

  const seq = String(highest + 1).padStart(SEQ_DIGITS, "0");

  if (format === "NNN") {
    return seq;
  }

  return `${year}${format === "YYYY-NNN" ? "-" : "/"}${seq}`;
};

/** The latest number of `year` in the format, for the "Next after …" hint. */
export const previousInvoiceNumber = (
  existing: readonly string[],
  year: number,
  format: InvoiceNumberFormat = "YYYY-NNN"
): string | null => {
  const next = nextInvoiceNumber(existing, year, format);

  return (
    existing.find(
      (number) => nextInvoiceNumber([number], year, format) === next
    ) ?? null
  );
};

export const defaultDueDate = (
  issueDate: string,
  termsDays: number = DEFAULT_PAYMENT_TERMS_DAYS
): string => addDays(issueDate, termsDays);

/** Days from issue to payment (never negative). */
export const daysToGetPaid = (issueDate: string, paidAt: string): number =>
  Math.max(0, daysBetween(issueDate, paidAt));

/** Rounded average days to get paid over paid invoices; null when none are paid. */
export const averageDaysToGetPaid = (
  invoices: readonly { issueDate: string; paidAt: string | null }[]
): number | null => {
  const days = invoices.flatMap((invoice) =>
    invoice.paidAt === null
      ? []
      : [daysToGetPaid(invoice.issueDate, invoice.paidAt)]
  );

  if (days.length === 0) {
    return null;
  }

  return Math.round(days.reduce((sum, value) => sum + value, 0) / days.length);
};

export interface ReceivableInvoice {
  id: string;
  status: StoredInvoiceStatus;
  dueDate: string;
  amountMinor: number;
  currency: Currency;
}

export interface Receivables {
  /** Everything sent and not paid yet, per currency. */
  unpaid: MoneyTotal[];
  /** The overdue part of `unpaid`. */
  overdue: MoneyTotal[];
  unpaidCount: number;
  overdueCount: number;
  oldestOverdue: { id: string; dueDate: string; daysOverdue: number } | null;
}

/** Who owes what: unpaid and overdue totals per currency, and the oldest overdue invoice. */
export const receivables = (
  invoices: readonly ReceivableInvoice[],
  today: string
): Receivables => {
  const sent = invoices.filter((invoice) => invoice.status === "sent");

  const overdue = sent
    .filter((invoice) => invoice.dueDate < today)
    .toSorted((a, b) => a.dueDate.localeCompare(b.dueDate));

  const [oldest] = overdue;

  return {
    oldestOverdue:
      oldest === undefined
        ? null
        : {
            daysOverdue: daysBetween(oldest.dueDate, today),
            dueDate: oldest.dueDate,
            id: oldest.id,
          },
    overdue: sumByCurrency(overdue),
    overdueCount: overdue.length,
    unpaid: sumByCurrency(sent),
    unpaidCount: sent.length,
  };
};
