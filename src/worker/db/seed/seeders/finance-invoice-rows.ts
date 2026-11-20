import { addDays } from "@shared/domain/dates";
import { formatInvoiceNumber } from "@shared/domain/finances/invoices";
import { toMinor } from "@shared/domain/money";
import type { Currency } from "@shared/domain/money";

import type {
  financeInvoices,
  financeTransactions,
} from "../../schema/finances";
import type { SeedContext } from "../context";

type InvoiceRow = typeof financeInvoices.$inferInsert;

type TransactionRow = typeof financeTransactions.$inferInsert;

export interface PlannedInvoice {
  clientId: string;
  issueDate: string;
  termsDays: number;
  amount: number;
  currency: Currency;
  description: string;
  periodStart: string | null;
  periodEnd: string | null;
  /** Days after issue it was paid; null = still open. */
  paidAfterDays: number | null;
  draft?: boolean;
}

/** An invoice row and the income entry its payment booked (category added by the caller). */
export interface SeededInvoice {
  invoice: InvoiceRow;
  payment: Omit<TransactionRow, "categoryId"> | null;
}

interface Numbering {
  number: string | null;
  numberSeq: number | null;
  numberYear: number | null;
}

/** Numbers issued invoices `YYYY-NNN` per year, in issue order; drafts get none. */
export const invoiceNumberer = () => {
  const sequence = new Map<number, number>();

  return (plan: PlannedInvoice): Numbering => {
    if (plan.draft === true) {
      return { number: null, numberSeq: null, numberYear: null };
    }

    const year = Number(plan.issueDate.slice(0, 4));
    const seq = (sequence.get(year) ?? 0) + 1;
    sequence.set(year, seq);

    return {
      number: formatInvoiceNumber(year, seq),
      numberSeq: seq,
      numberYear: year,
    };
  };
};

const statusOf = (draft: boolean, paid: boolean) => {
  if (draft) {
    return "draft";
  }

  return paid ? "paid" : "sent";
};

/** The invoice row, and the income entry its payment booked (if paid by today). */
export const toInvoiceRow = (
  ctx: SeedContext,
  plan: PlannedInvoice,
  numbering: Numbering
): SeededInvoice => {
  const draft = plan.draft === true;
  const id = crypto.randomUUID();

  const paidAt =
    plan.paidAfterDays === null
      ? null
      : addDays(plan.issueDate, plan.paidAfterDays);

  const paid = paidAt !== null && paidAt <= ctx.today;
  const amountMinor = toMinor(plan.amount);

  const periodLabel =
    plan.periodStart === null ? "" : ` — ${plan.periodStart.slice(0, 7)}`;

  return {
    invoice: {
      ...numbering,
      amountMinor,
      clientId: plan.clientId,
      createdAt: `${addDays(plan.issueDate, -1)}T10:00:00.000Z`,
      currency: plan.currency,
      description: `${plan.description}${periodLabel}`,
      dueDate: addDays(plan.issueDate, plan.termsDays),
      householdId: ctx.householdId,
      id,
      issueDate: plan.issueDate,
      issuedAt: draft ? null : `${plan.issueDate}T09:00:00.000Z`,
      paidAt: paid ? paidAt : null,
      periodEnd: plan.periodEnd,
      periodStart: plan.periodStart,
      sentAt: draft ? null : plan.issueDate,
      status: statusOf(draft, paid),
    },
    payment: paid
      ? {
          amountMinor,
          clientId: plan.clientId,
          currency: plan.currency,
          date: paidAt,
          description: `Invoice ${numbering.number ?? ""}`,
          householdId: ctx.householdId,
          invoiceId: id,
          kind: "income",
        }
      : null,
  };
};
