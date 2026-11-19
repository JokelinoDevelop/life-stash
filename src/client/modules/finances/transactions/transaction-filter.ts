/** What the ledger list is narrowed to; mirrors the list endpoint's query. */
export interface TransactionFilter {
  kind?: "income" | "expense";
  categoryId?: string;
  from?: string;
  to?: string;
  q?: string;
}
