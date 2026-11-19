import type { Currency } from "../money";
import { CURRENCIES } from "../money";
import type { TransactionKind } from "./kinds";

export interface CashflowEntry {
  kind: TransactionKind;
  date: string;
  amountMinor: number;
  currency: Currency;
}

export interface MonthCashflow {
  /** 1–12. */
  month: number;
  incomeMinor: number;
  expenseMinor: number;
  netMinor: number;
}

export interface CurrencyCashflow {
  currency: Currency;
  months: MonthCashflow[];
  incomeMinor: number;
  expenseMinor: number;
  netMinor: number;
}

const MONTHS = 12;

const emptyMonths = (): MonthCashflow[] =>
  Array.from({ length: MONTHS }, (_, index) => ({
    expenseMinor: 0,
    incomeMinor: 0,
    month: index + 1,
    netMinor: 0,
  }));

/**
 * Income, spending and net per month of `year`, one series per currency (never converted).
 * Every series has all 12 months so charts line up; currencies with no entries are left out.
 */
export const monthlyCashflow = (
  entries: readonly CashflowEntry[],
  year: number
): CurrencyCashflow[] => {
  const prefix = `${year}-`;
  const byCurrency = new Map<Currency, MonthCashflow[]>();

  for (const entry of entries.filter((item) => item.date.startsWith(prefix))) {
    const months = byCurrency.get(entry.currency) ?? emptyMonths();
    byCurrency.set(entry.currency, months);
    const bucket = months[Number(entry.date.slice(5, 7)) - 1];

    if (bucket === undefined) {
      continue;
    }

    if (entry.kind === "income") {
      bucket.incomeMinor += entry.amountMinor;
      bucket.netMinor += entry.amountMinor;
    } else {
      bucket.expenseMinor += entry.amountMinor;
      bucket.netMinor -= entry.amountMinor;
    }
  }

  return CURRENCIES.flatMap((currency) => {
    const months = byCurrency.get(currency);

    if (months === undefined) {
      return [];
    }

    const incomeMinor = months.reduce((sum, m) => sum + m.incomeMinor, 0);
    const expenseMinor = months.reduce((sum, m) => sum + m.expenseMinor, 0);

    return [
      {
        currency,
        expenseMinor,
        incomeMinor,
        months,
        netMinor: incomeMinor - expenseMinor,
      },
    ];
  });
};
