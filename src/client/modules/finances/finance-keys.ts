import type { TransactionFilter } from "./transactions/transaction-filter";

/** Query keys for Finances. Every finance mutation invalidates `financeKeys.all`. */
export const financeKeys = {
  all: ["finances"] as const,
  categories: ["finances", "categories"] as const,
  transaction: (transactionId: string) =>
    ["finances", "transaction", transactionId] as const,
  transactions: (filter: TransactionFilter) =>
    ["finances", "transactions", filter] as const,
};
