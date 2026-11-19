import type { TransactionFilter } from "./transactions/transaction-filter";

/** Query keys for Finances. Every finance mutation invalidates `financeKeys.all`. */
export const financeKeys = {
  all: ["finances"] as const,
  categories: ["finances", "categories"] as const,
  client: (clientId: string, year: number) =>
    ["finances", "client", clientId, year] as const,
  clients: (year: number) => ["finances", "clients", year] as const,
  files: (ownerType: string, ownerId: string) =>
    ["finances", "files", ownerType, ownerId] as const,
  invoice: (invoiceId: string) => ["finances", "invoice", invoiceId] as const,
  invoices: (filter: { status: string; clientId?: string; year: number }) =>
    ["finances", "invoices", filter] as const,
  nextInvoiceNumber: ["finances", "invoices", "next-number"] as const,
  overview: (year: number) => ["finances", "overview", year] as const,
  settings: ["finances", "settings"] as const,
  transaction: (transactionId: string) =>
    ["finances", "transaction", transactionId] as const,
  transactions: (filter: TransactionFilter) =>
    ["finances", "transactions", filter] as const,
};
