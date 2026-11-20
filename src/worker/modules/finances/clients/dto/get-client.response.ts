import type { InvoiceLanguage } from "@shared/domain/finances/invoice-document";
import type { InvoiceStatus } from "@shared/domain/finances/invoices";
import type { Currency, MoneyTotal } from "@shared/domain/money";

import type { ClientDetail } from "../clients.service";

export interface GetClientResponse {
  year: number;
  client: {
    id: string;
    name: string;
    kind: "client" | "employer";
    currency: Currency;
    paymentTermsDays: number;
    email: string | null;
    notes: string | null;
    address: string | null;
    taxId: string | null;
    invoiceLanguage: InvoiceLanguage;
    archived: boolean;
    since: string | null;
    earnedThisYear: MoneyTotal[];
    earnedAllTime: MoneyTotal[];
    unpaid: MoneyTotal[];
    late: MoneyTotal[];
    averageDaysToGetPaid: number | null;
    earnedByMonth: { month: number; totals: MoneyTotal[] }[];
  };
  invoices: {
    id: string;
    number: string | null;
    issueDate: string;
    dueDate: string;
    paidAt: string | null;
    periodStart: string | null;
    description: string | null;
    amountMinor: number;
    currency: Currency;
    status: InvoiceStatus;
    daysOverdue: number;
  }[];
}

export const toGetClientResponse = (
  year: number,
  detail: ClientDetail
): GetClientResponse => ({
  client: {
    address: detail.address,
    archived: detail.archivedAt !== null,
    averageDaysToGetPaid: detail.averageDaysToGetPaid,
    currency: detail.currency,
    earnedAllTime: detail.earnedAllTime,
    earnedByMonth: detail.earnedByMonth,
    earnedThisYear: detail.earnedThisYear,
    email: detail.email,
    id: detail.id,
    invoiceLanguage: detail.invoiceLanguage,
    kind: detail.kind,
    late: detail.late,
    name: detail.name,
    notes: detail.notes,
    paymentTermsDays: detail.paymentTermsDays,
    since: detail.since,
    taxId: detail.taxId,
    unpaid: detail.unpaid,
  },
  invoices: detail.invoices.map((invoice) => ({
    amountMinor: invoice.amountMinor,
    currency: invoice.currency,
    daysOverdue: invoice.daysOverdue,
    description: invoice.description,
    dueDate: invoice.dueDate,
    id: invoice.id,
    issueDate: invoice.issueDate,
    number: invoice.number,
    paidAt: invoice.paidAt,
    periodStart: invoice.periodStart,
    status: invoice.displayStatus,
  })),
  year,
});
