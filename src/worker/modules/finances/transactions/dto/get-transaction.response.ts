import type { TransactionKind } from "@shared/domain/finances/kinds";
import type { Currency } from "@shared/domain/money";

import type { TransactionRow } from "../transactions.repository";

export interface GetTransactionResponse {
  transaction: {
    id: string;
    kind: TransactionKind;
    date: string;
    amountMinor: number;
    currency: Currency;
    categoryId: string;
    clientId: string | null;
    invoiceId: string | null;
    description: string;
    notes: string | null;
    createdAt: string;
  };
}

export const toGetTransactionResponse = (
  row: TransactionRow
): GetTransactionResponse => ({
  transaction: {
    amountMinor: row.amountMinor,
    categoryId: row.categoryId,
    clientId: row.clientId,
    createdAt: row.createdAt,
    currency: row.currency,
    date: row.date,
    description: row.description,
    id: row.id,
    invoiceId: row.invoiceId,
    kind: row.kind,
    notes: row.notes,
  },
});
