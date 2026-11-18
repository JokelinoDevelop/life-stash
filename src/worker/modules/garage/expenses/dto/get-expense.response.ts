import type { ExpenseCategory } from "@shared/domain/garage-kinds";
import type { Currency } from "@shared/domain/money";

import type { garageExpenses } from "../../../../db/schema/garage";

export interface GetExpenseResponse {
  expense: {
    id: string;
    carId: string;
    category: ExpenseCategory;
    date: string;
    amountMinor: number;
    currency: Currency;
    odometerKm: number | null;
    quantityMilli: number | null;
    notes: string | null;
  };
}

export const toGetExpenseResponse = (
  row: typeof garageExpenses.$inferSelect
): GetExpenseResponse => ({
  expense: {
    amountMinor: row.amountMinor,
    carId: row.carId,
    category: row.category,
    currency: row.currency,
    date: row.date,
    id: row.id,
    notes: row.notes,
    odometerKm: row.odometerKm,
    quantityMilli: row.quantityMilli,
  },
});
