import { yearOf } from "./dates";
import { EXPENSE_CATEGORIES } from "./garage-kinds";
import type { ExpenseCategory, VisitKind } from "./garage-kinds";
import { CURRENCIES } from "./money";
import type { Currency } from "./money";
import { effectiveVisitTotal } from "./spending";
import type { VisitCost } from "./spending";

export interface ReportVisit extends VisitCost {
  kind: VisitKind;
}

export interface ReportExpense {
  date: string;
  currency: Currency;
  amountMinor: number;
  category: ExpenseCategory;
}

export interface CategoryAmount {
  category: ExpenseCategory;
  amountMinor: number;
}

export interface YearSpending {
  year: number;
  currency: Currency;
  maintenanceMinor: number;
  repairMinor: number;
  otherMinor: number;
  otherByCategory: CategoryAmount[];
}

const emptyYear = (year: number, currency: Currency): YearSpending => ({
  maintenanceMinor: 0,
  otherByCategory: [],
  otherMinor: 0,
  repairMinor: 0,
  currency,
  year,
});

const addCategory = (
  target: YearSpending,
  category: ExpenseCategory,
  amount: number
) => {
  const existing = target.otherByCategory.find(
    (entry) => entry.category === category
  );

  if (existing) {
    existing.amountMinor += amount;
  } else {
    target.otherByCategory.push({ amountMinor: amount, category });
  }
};

/**
 * Spending per year and currency: maintenance and repairs from my own service visits
 * (previous-owner work excluded) and other costs from expenses. Currencies are never mixed.
 */
export const spendingByYear = (
  visits: readonly ReportVisit[],
  expenses: readonly ReportExpense[]
): YearSpending[] => {
  const years = new Map<string, YearSpending>();

  const bucket = (date: string, currency: Currency) => {
    const year = yearOf(date);
    const key = `${year}:${currency}`;
    const current = years.get(key) ?? emptyYear(year, currency);
    years.set(key, current);

    return current;
  };

  for (const visit of visits) {
    const amount = visit.byPreviousOwner ? null : effectiveVisitTotal(visit);

    if (amount !== null) {
      const target = bucket(visit.date, visit.currency);

      if (visit.kind === "repair") {
        target.repairMinor += amount;
      } else {
        target.maintenanceMinor += amount;
      }
    }
  }

  for (const expense of expenses) {
    const target = bucket(expense.date, expense.currency);
    target.otherMinor += expense.amountMinor;
    addCategory(target, expense.category, expense.amountMinor);
  }

  for (const year of years.values()) {
    year.otherByCategory.sort(
      (a, b) =>
        EXPENSE_CATEGORIES.indexOf(a.category) -
        EXPENSE_CATEGORIES.indexOf(b.category)
    );
  }

  return [...years.values()].toSorted(
    (a, b) =>
      b.year - a.year ||
      CURRENCIES.indexOf(a.currency) - CURRENCIES.indexOf(b.currency)
  );
};

export interface MonthSpending {
  /** `YYYY-MM` */
  month: string;
  currency: Currency;
  amountMinor: number;
}

/**
 * Everything I spent per month of `year` and currency: my own service visits
 * (previous-owner work excluded) plus expenses. Months without spending are omitted.
 */
export const spendingByMonth = (
  visits: readonly ReportVisit[],
  expenses: readonly ReportExpense[],
  year: number
): MonthSpending[] => {
  const months = new Map<string, MonthSpending>();

  const add = (date: string, currency: Currency, amountMinor: number) => {
    if (yearOf(date) !== year) {
      return;
    }

    const month = date.slice(0, 7);
    const key = `${month}:${currency}`;
    const current = months.get(key) ?? { amountMinor: 0, currency, month };
    current.amountMinor += amountMinor;
    months.set(key, current);
  };

  for (const visit of visits) {
    const amount = visit.byPreviousOwner ? null : effectiveVisitTotal(visit);

    if (amount !== null) {
      add(visit.date, visit.currency, amount);
    }
  }

  for (const expense of expenses) {
    add(expense.date, expense.currency, expense.amountMinor);
  }

  return [...months.values()].toSorted(
    (a, b) =>
      a.month.localeCompare(b.month) ||
      CURRENCIES.indexOf(a.currency) - CURRENCIES.indexOf(b.currency)
  );
};

export interface DatedCost {
  date: string;
  currency: Currency;
  amountMinor: number;
}

/**
 * Every cost I paid, one line per visit or expense (previous-owner work and visits without
 * a known cost excluded), for reports over any date range.
 */
export const spendingEntries = (
  visits: readonly ReportVisit[],
  expenses: readonly ReportExpense[]
): DatedCost[] => [
  ...visits.flatMap((visit) => {
    const amount = visit.byPreviousOwner ? null : effectiveVisitTotal(visit);

    return amount === null
      ? []
      : [{ amountMinor: amount, currency: visit.currency, date: visit.date }];
  }),
  ...expenses.map((expense) => ({
    amountMinor: expense.amountMinor,
    currency: expense.currency,
    date: expense.date,
  })),
];
