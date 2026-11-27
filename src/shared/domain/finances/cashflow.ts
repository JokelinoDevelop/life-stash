import type { Currency } from "../money";
import { CURRENCIES } from "../money";
import type { TransactionKind } from "./kinds";
import { bucketKey, bucketKeys } from "./period";
import type { DateRange, Granularity } from "./period";

export interface CashflowEntry {
  kind: TransactionKind;
  date: string;
  amountMinor: number;
  currency: Currency;
}

export interface BucketCashflow {
  /** `2026-03`, `2026-Q1` or `2026` (see `bucketKey`). */
  key: string;
  incomeMinor: number;
  expenseMinor: number;
  netMinor: number;
}

export interface CurrencyCashflow {
  currency: Currency;
  buckets: BucketCashflow[];
  incomeMinor: number;
  expenseMinor: number;
  netMinor: number;
}

/**
 * Income, spending and net per bucket of `range`, one series per currency (never converted).
 * Every series has every bucket so charts line up; currencies with no entries are left out.
 */
export const cashflowByBucket = (
  entries: readonly CashflowEntry[],
  range: DateRange,
  granularity: Granularity
): CurrencyCashflow[] => {
  const keys = bucketKeys(range, granularity);
  const index = new Map(keys.map((key, position) => [key, position]));
  const byCurrency = new Map<Currency, BucketCashflow[]>();

  const inRange = entries.filter(
    (entry) => entry.date >= range.from && entry.date <= range.to
  );

  for (const entry of inRange) {
    const buckets =
      byCurrency.get(entry.currency) ??
      keys.map((bucket) => ({
        expenseMinor: 0,
        incomeMinor: 0,
        key: bucket,
        netMinor: 0,
      }));

    byCurrency.set(entry.currency, buckets);

    const position = index.get(bucketKey(entry.date, granularity));
    const bucket = position === undefined ? undefined : buckets[position];

    const signed =
      entry.kind === "income" ? entry.amountMinor : -entry.amountMinor;

    if (bucket !== undefined) {
      bucket.incomeMinor += entry.kind === "income" ? entry.amountMinor : 0;
      bucket.expenseMinor += entry.kind === "income" ? 0 : entry.amountMinor;
      bucket.netMinor += signed;
    }
  }

  return CURRENCIES.flatMap((currency) => {
    const buckets = byCurrency.get(currency);

    if (buckets === undefined) {
      return [];
    }

    const incomeMinor = buckets.reduce((sum, b) => sum + b.incomeMinor, 0);
    const expenseMinor = buckets.reduce((sum, b) => sum + b.expenseMinor, 0);

    return [
      {
        buckets,
        currency,
        expenseMinor,
        incomeMinor,
        netMinor: incomeMinor - expenseMinor,
      },
    ];
  });
};

export interface MonthPoint {
  /** `YYYY-MM`. */
  key: string;
  netMinor: number;
}

export interface CashflowHighlights {
  currency: Currency;
  /** Months averaged over. */
  months: number;
  avgIncomeMinor: number;
  avgExpenseMinor: number;
  avgNetMinor: number;
  /** Share of income kept (net ÷ income), rounded; null without income. */
  savingsRatePercent: number | null;
  /** Month with the highest net; null with fewer than two months. */
  best: MonthPoint | null;
  /** Month with the lowest net; null with fewer than two months. */
  worst: MonthPoint | null;
}

const PERCENT = 100;

/**
 * Monthly averages, savings rate and best / worst month per currency, from a monthly
 * series (`cashflowByBucket(…, "month")`) that covers only months that have started.
 */
export const cashflowHighlights = (
  monthly: readonly CurrencyCashflow[]
): CashflowHighlights[] =>
  monthly.map((series) => {
    const months = Math.max(1, series.buckets.length);
    const enough = series.buckets.length >= 2;
    let best: BucketCashflow | null = null;
    let worst: BucketCashflow | null = null;

    for (const bucket of series.buckets) {
      if (best === null || bucket.netMinor > best.netMinor) {
        best = bucket;
      }

      if (worst === null || bucket.netMinor < worst.netMinor) {
        worst = bucket;
      }
    }

    const point = (bucket: BucketCashflow | null): MonthPoint | null =>
      enough && bucket !== null
        ? { key: bucket.key, netMinor: bucket.netMinor }
        : null;

    // oxlint-disable-next-line sonarjs/shorthand-property-grouping -- conflicts with sort-keys
    return {
      avgExpenseMinor: Math.round(series.expenseMinor / months),
      avgIncomeMinor: Math.round(series.incomeMinor / months),
      avgNetMinor: Math.round(series.netMinor / months),
      best: point(best),
      currency: series.currency,
      months,
      savingsRatePercent:
        series.incomeMinor <= 0
          ? null
          : Math.round((series.netMinor / series.incomeMinor) * PERCENT),
      worst: point(worst),
    };
  });

/** Amounts per bucket key (aligned with `keys`), for one category's trend line. */
export const totalsByBucket = (
  entries: readonly { date: string; amountMinor: number }[],
  keys: readonly string[],
  granularity: Granularity
): number[] => {
  const index = new Map(keys.map((key, position) => [key, position]));
  const totals = keys.map(() => 0);

  for (const entry of entries) {
    const position = index.get(bucketKey(entry.date, granularity));

    if (position !== undefined) {
      totals[position] = (totals[position] ?? 0) + entry.amountMinor;
    }
  }

  return totals;
};
