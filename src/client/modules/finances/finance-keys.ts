import type { TransactionFilter } from "./transactions/transaction-filter";

/** Query keys for Finances. Every finance mutation invalidates `financeKeys.all`. */
export const financeKeys = {
  all: ["finances"] as const,
  businessProfile: ["finances", "business-profile"] as const,
  categories: ["finances", "categories"] as const,
  client: (clientId: string, year: number) =>
    ["finances", "client", clientId, year] as const,
  clients: (year: number) => ["finances", "clients", year] as const,
  files: (ownerType: string, ownerId: string) =>
    ["finances", "files", ownerType, ownerId] as const,
  invoice: (invoiceId: string) => ["finances", "invoice", invoiceId] as const,
  invoices: (filter: { status: string; clientId?: string; year: number }) =>
    ["finances", "invoices", filter] as const,
  nextInvoiceNumber: (year: number) =>
    ["finances", "invoices", "next-number", year] as const,
  invoiceDocument: (invoiceId: string) =>
    ["finances", "invoice", invoiceId, "document"] as const,
  projects: (clientId: string | null) =>
    ["finances", "projects", clientId] as const,
  recurring: ["finances", "recurring"] as const,
  overview: (year: number) => ["finances", "overview", year] as const,
  /** Every year's overview (prefix of `overview`). */
  overviewAll: ["finances", "overview"] as const,
  settings: ["finances", "settings"] as const,
  transaction: (transactionId: string) =>
    ["finances", "transaction", transactionId] as const,
  transactions: (filter: TransactionFilter) =>
    ["finances", "transactions", filter] as const,
  /** Every filtered transaction list (prefix of `transactions`). */
  transactionsAll: ["finances", "transactions"] as const,
};
