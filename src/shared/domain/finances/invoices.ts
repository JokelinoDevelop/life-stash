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

export interface InvoiceNumberParts {
  year: number;
  seq: number;
}

const FULL_NUMBER = /^(?<year>\d{4})[-/](?<seq>\d{1,9})$/u;
const PLAIN_NUMBER = /^(?<seq>\d{1,9})$/u;

/**
 * Reads a typed invoice number: `YYYY-NNN`, `YYYY/NNN` or a plain `NNN` (which counts as a
 * sequence of `issueYear`, e.g. the Wise invoice `011`). A year must be the issue year.
 * Returns null for anything else, including sequence 0.
 */
export const parseInvoiceNumber = (
  text: string,
  issueYear: number
): InvoiceNumberParts | null => {
  const trimmed = text.trim();
  const full = FULL_NUMBER.exec(trimmed)?.groups;

  if (full?.year !== undefined && full.seq !== undefined) {
    const year = Number(full.year);
    const seq = Number(full.seq);

    return year === issueYear && seq > 0 ? { seq, year } : null;
  }

  const plain = PLAIN_NUMBER.exec(trimmed)?.groups;

  if (plain?.seq !== undefined && Number(plain.seq) > 0) {
    return { seq: Number(plain.seq), year: issueYear };
  }

  return null;
};

/** `2026-012`; the sequence is at least three digits wide (`999` is followed by `1000`). */
export const formatInvoiceNumber = (
  year: number,
  seq: number,
  format: InvoiceNumberFormat = "YYYY-NNN"
): string => {
  const padded = String(seq).padStart(SEQ_DIGITS, "0");

  if (format === "NNN") {
    return padded;
  }

  return `${year}${format === "YYYY-NNN" ? "-" : "/"}${padded}`;
};

/** The sequence after the highest one used (1 when none). */
export const nextInvoiceSeq = (usedSeqs: readonly number[]): number => {
  let highest = 0;

  for (const seq of usedSeqs) {
    highest = Math.max(highest, seq);
  }

  return highest + 1;
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
