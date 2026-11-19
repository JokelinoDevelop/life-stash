import type { TransactionKind } from "@shared/domain/finances/kinds";
import type { Currency } from "@shared/domain/money";

import type { RecurringWithNames } from "../recurring.repository";

export interface ListRecurringResponse {
  recurring: {
    id: string;
    kind: TransactionKind;
    description: string;
    amountMinor: number;
    currency: Currency;
    dayOfMonth: number;
    active: boolean;
    lastHandledMonth: string | null;
    category: { id: string; name: string; icon: string | null };
    client: { id: string; name: string } | null;
  }[];
}

export const toListRecurringResponse = (
  rows: readonly RecurringWithNames[]
): ListRecurringResponse => ({
  recurring: rows.map((row) => ({
    active: row.active,
    amountMinor: row.amountMinor,
    category: {
      icon: row.categoryIcon,
      id: row.categoryId,
      name: row.categoryName,
    },
    client:
      row.clientId === null || row.clientName === null
        ? null
        : { id: row.clientId, name: row.clientName },
    currency: row.currency,
    dayOfMonth: row.dayOfMonth,
    description: row.description,
    id: row.id,
    kind: row.kind,
    lastHandledMonth: row.lastHandledMonth,
  })),
});
