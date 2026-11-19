import type { TransactionKind } from "@shared/domain/finances/kinds";
import { sumByCurrency } from "@shared/domain/money";
import type { Currency, MoneyTotal } from "@shared/domain/money";

import { encodeCursor } from "../cursor";
import type { TransactionPage } from "../transactions.service";

export interface ListTransactionsResponse {
  transactions: {
    id: string;
    kind: TransactionKind;
    date: string;
    amountMinor: number;
    currency: Currency;
    description: string;
    notes: string | null;
    category: {
      id: string;
      name: string;
      icon: string | null;
      systemKey: "invoices" | null;
    };
    client: { id: string; name: string } | null;
    /** Set when "mark paid" created the entry; edit the invoice instead. */
    invoice: { id: string; number: string } | null;
    attachments: number;
  }[];
  nextCursor: string | null;
  /** Rows matching the filter; only on the first page (null when paging on). */
  total: number | null;
  /** Per month of the whole filtered set (first page only): count, money in, money out. */
  months: {
    month: string;
    entries: number;
    income: MoneyTotal[];
    expense: MoneyTotal[];
  }[];
}

const toMonths = (
  rows: TransactionPage["months"]
): ListTransactionsResponse["months"] => {
  const months = new Map<string, typeof rows>();

  for (const row of rows) {
    const list = months.get(row.month) ?? [];
    list.push(row);
    months.set(row.month, list);
  }

  return [...months.entries()]
    .toSorted(([a], [b]) => b.localeCompare(a))
    .map(([month, list]) => ({
      entries: list.reduce((total, row) => total + row.entries, 0),
      expense: sumByCurrency(list.filter((row) => row.kind === "expense")),
      income: sumByCurrency(list.filter((row) => row.kind === "income")),
      month,
    }));
};

export const toListTransactionsResponse = (
  page: TransactionPage
): ListTransactionsResponse => ({
  months: toMonths(page.months),
  nextCursor: page.nextCursor === null ? null : encodeCursor(page.nextCursor),
  total: page.total < 0 ? null : page.total,
  transactions: page.rows.map((row) => ({
    amountMinor: row.amountMinor,
    attachments: row.attachments,
    category: row.category,
    client: row.client,
    currency: row.currency,
    date: row.date,
    description: row.description,
    id: row.id,
    invoice: row.invoice,
    kind: row.kind,
    notes: row.notes,
  })),
});
