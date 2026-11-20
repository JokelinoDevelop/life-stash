import type { InvoiceStatus } from "@shared/domain/finances/invoices";
import type { Currency } from "@shared/domain/money";

import type { LedgerLinksPort } from "../transactions/ledger-links.repository";
import type { TransactionRow } from "../transactions/transactions.repository";
import type { InvoiceStats } from "./invoice-selection";
import type { InvoiceWithClient } from "./invoices.repository";

/** What a draft holds; the number is only given when issuing. */
export interface InvoiceInput {
  clientId: string;
  issueDate: string;
  dueDate: string;
  periodStart: string | null;
  periodEnd: string | null;
  description: string | null;
  amountMinor: number;
  currency: Currency;
  notes: string | null;
  projectId: string | null;
}

export interface InvoiceListRow extends InvoiceWithClient {
  displayStatus: InvoiceStatus;
  daysOverdue: number;
  attachments: number;
}

export interface InvoiceList {
  rows: InvoiceListRow[];
  stats: InvoiceStats;
}

export interface InvoiceDetail extends InvoiceListRow {
  transaction: TransactionRow | null;
  firstAttachedAt: string | null;
}

/** What invoices need from the ledger: the linked entry, created and removed with the invoice. */
export type InvoiceTransactionsPort = Pick<
  LedgerLinksPort,
  | "findByInvoice"
  | "insertForInvoice"
  | "deleteByInvoice"
  | "setDeletedByInvoice"
>;

/** Issue now (with a typed number, or the next one when null) or keep it a draft. */
export type IssueRequest = { number: string | null } | null;
