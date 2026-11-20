import type { InvoiceLanguage } from "@shared/domain/finances/invoice-document";
import type { InvoiceStatus } from "@shared/domain/finances/invoices";
import type { Currency, MoneyTotal } from "@shared/domain/money";

import type { ClientSummary } from "../clients.service";

export interface ListClientsResponse {
  year: number;
  clients: {
    id: string;
    name: string;
    kind: "client" | "employer";
    currency: Currency;
    paymentTermsDays: number;
    notes: string | null;
    address: string | null;
    taxId: string | null;
    email: string | null;
    invoiceLanguage: InvoiceLanguage;
    archived: boolean;
    earnedThisYear: MoneyTotal[];
    unpaid: MoneyTotal[];
    late: MoneyTotal[];
    lastInvoice: {
      number: string | null;
      status: InvoiceStatus;
      issueDate: string;
    } | null;
  }[];
}

export const toListClientsResponse = (
  year: number,
  rows: readonly ClientSummary[]
): ListClientsResponse => ({
  clients: rows.map((row) => ({
    address: row.address,
    archived: row.archivedAt !== null,
    currency: row.currency,
    earnedThisYear: row.earnedThisYear,
    email: row.email,
    id: row.id,
    invoiceLanguage: row.invoiceLanguage,
    kind: row.kind,
    lastInvoice: row.lastInvoice,
    late: row.late,
    name: row.name,
    notes: row.notes,
    paymentTermsDays: row.paymentTermsDays,
    taxId: row.taxId,
    unpaid: row.unpaid,
  })),
  year,
});
