import type { ExpenseCategory } from "@shared/domain/garage-kinds";
import { sumByCurrency } from "@shared/domain/money";
import type { Currency, MoneyTotal } from "@shared/domain/money";

interface ExpenseLike {
  date: string;
  category: ExpenseCategory;
  currency: Currency;
  amountMinor: number;
}

export interface MonthGroup<T extends ExpenseLike> {
  /** `YYYY-MM` */
  month: string;
  expenses: T[];
  totals: MoneyTotal[];
}

/** Groups expenses (already sorted newest first) by calendar month. */
export const groupByMonth = <T extends ExpenseLike>(
  expenses: readonly T[]
): MonthGroup<T>[] => {
  const groups = new Map<string, T[]>();

  for (const expense of expenses) {
    const month = expense.date.slice(0, 7);
    const list = groups.get(month) ?? [];
    list.push(expense);
    groups.set(month, list);
  }

  return [...groups.entries()].map(([month, list]) => ({
    expenses: list,
    totals: sumByCurrency(list),
    month,
  }));
};

export interface CategoryTotal {
  category: ExpenseCategory;
  totals: MoneyTotal[];
}

/** Totals per category for one calendar year. */
export const totalsByCategory = (
  expenses: readonly ExpenseLike[],
  year: number
): CategoryTotal[] => {
  const byCategory = new Map<ExpenseCategory, ExpenseLike[]>();

  for (const expense of expenses) {
    if (expense.date.startsWith(`${year}-`)) {
      const list = byCategory.get(expense.category) ?? [];
      list.push(expense);
      byCategory.set(expense.category, list);
    }
  }

  return [...byCategory.entries()].map(([category, list]) => ({
    category,
    totals: sumByCurrency(list),
  }));
};
