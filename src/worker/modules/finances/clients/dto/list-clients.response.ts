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
    archived: boolean;
    earnedThisYear: MoneyTotal[];
    unpaid: MoneyTotal[];
    late: MoneyTotal[];
    lastInvoice: {
      number: string;
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
    archived: row.archivedAt !== null,
    currency: row.currency,
    earnedThisYear: row.earnedThisYear,
    id: row.id,
    kind: row.kind,
    lastInvoice: row.lastInvoice,
    late: row.late,
    name: row.name,
    notes: row.notes,
    paymentTermsDays: row.paymentTermsDays,
    unpaid: row.unpaid,
  })),
  year,
});
