import type { ExpenseCategory } from "@shared/domain/garage-kinds";
import type { Currency } from "@shared/domain/money";

export interface CarSpendingResponse {
  years: {
    year: number;
    currency: Currency;
    maintenanceMinor: number;
    repairMinor: number;
    otherMinor: number;
    otherByCategory: { category: ExpenseCategory; amountMinor: number }[];
  }[];
}
