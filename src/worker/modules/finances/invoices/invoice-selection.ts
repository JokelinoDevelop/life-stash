import {
  averageDaysToGetPaid,
  receivables,
} from "@shared/domain/finances/invoices";
import type { Receivables } from "@shared/domain/finances/invoices";
import { sumByCurrency } from "@shared/domain/money";
import type { MoneyTotal } from "@shared/domain/money";

import type { InvoiceWithClient } from "./invoices.repository";

export type InvoiceStatusFilter = "all" | "unpaid" | "paid";

export interface InvoiceStats {
  invoiced: MoneyTotal[];
  paid: MoneyTotal[];
  receivables: Receivables;
  averageDaysToGetPaid: number | null;
}

const isUnpaid = (status: string) => status === "draft" || status === "sent";

/** Paid invoices belong to the year they were paid; others to their issue year. */
const yearOf = (invoice: InvoiceWithClient): string =>
  (invoice.status === "paid" && invoice.paidAt !== null
    ? invoice.paidAt
    : invoice.issueDate
  ).slice(0, 4);

const isVisible = (
  invoice: InvoiceWithClient,
  status: InvoiceStatusFilter,
  year: string
): boolean => {
  if (status === "unpaid") {
    return isUnpaid(invoice.status);
  }

  if (status === "paid") {
    return invoice.status === "paid" && yearOf(invoice) === year;
  }

  return isUnpaid(invoice.status) || yearOf(invoice) === year;
};

/**
 * What the invoices page shows. Unpaid invoices always show (they need attention whatever
 * their year); paid and void ones only for `year`. Stats describe `year`.
 */
export interface InvoiceSelection {
  visible: InvoiceWithClient[];
  stats: InvoiceStats;
}

export const selectInvoices = (
  all: readonly InvoiceWithClient[],
  filter: { status: InvoiceStatusFilter; year: number },
  today: string
): InvoiceSelection => {
  const year = String(filter.year);

  const paidInYear = all.filter(
    (invoice) => invoice.status === "paid" && yearOf(invoice) === year
  );

  return {
    stats: {
      averageDaysToGetPaid: averageDaysToGetPaid(paidInYear),
      invoiced: sumByCurrency(
        all.filter(
          (invoice) =>
            invoice.issueDate.startsWith(`${year}-`) &&
            invoice.status !== "draft" &&
            invoice.status !== "void"
        )
      ),
      paid: sumByCurrency(paidInYear),
      receivables: receivables(all, today),
    },
    visible: all.filter((invoice) => isVisible(invoice, filter.status, year)),
  };
};
