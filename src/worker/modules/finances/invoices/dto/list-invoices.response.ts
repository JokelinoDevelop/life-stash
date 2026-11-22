import type { InvoiceStatus } from "@shared/domain/finances/invoices";
import type { Currency, MoneyTotal } from "@shared/domain/money";

import type { InvoiceList } from "../invoices.service";

export interface ListInvoicesResponse {
  year: number;
  invoices: {
    id: string;
    /** Null while a draft. */
    number: string | null;
    clientId: string;
    clientName: string;
    projectId: string | null;
    projectName: string | null;
    issueDate: string;
    dueDate: string;
    sentAt: string | null;
    issuedAt: string | null;
    voidedAt: string | null;
    paidAt: string | null;
    periodStart: string | null;
    periodEnd: string | null;
    description: string | null;
    amountMinor: number;
    currency: Currency;
    status: InvoiceStatus;
    daysOverdue: number;
    attachments: number;
    /** Has lines: the app draws its PDF. */
    itemised: boolean;
  }[];
  stats: {
    invoiced: MoneyTotal[];
    paid: MoneyTotal[];
    unpaid: MoneyTotal[];
    overdue: MoneyTotal[];
    unpaidCount: number;
    overdueCount: number;
    averageDaysToGetPaid: number | null;
  };
}

export const toListInvoicesResponse = (
  year: number,
  list: InvoiceList
): ListInvoicesResponse => ({
  invoices: list.rows.map((row) => ({
    amountMinor: row.amountMinor,
    attachments: row.attachments,
    clientId: row.clientId,
    clientName: row.clientName,
    currency: row.currency,
    daysOverdue: row.daysOverdue,
    description: row.description,
    dueDate: row.dueDate,
    id: row.id,
    issueDate: row.issueDate,
    issuedAt: row.issuedAt,
    itemised: row.itemised,
    number: row.number,
    paidAt: row.paidAt,
    periodEnd: row.periodEnd,
    periodStart: row.periodStart,
    projectId: row.projectId,
    projectName: row.projectName,
    sentAt: row.sentAt,
    status: row.displayStatus,
    voidedAt: row.voidedAt,
  })),
  stats: {
    averageDaysToGetPaid: list.stats.averageDaysToGetPaid,
    invoiced: list.stats.invoiced,
    overdue: list.stats.receivables.overdue,
    overdueCount: list.stats.receivables.overdueCount,
    paid: list.stats.paid,
    unpaid: list.stats.receivables.unpaid,
    unpaidCount: list.stats.receivables.unpaidCount,
  },
  year,
});
