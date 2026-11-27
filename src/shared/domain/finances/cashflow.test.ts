import { describe, expect, it } from "vitest";

import {
  cashflowByBucket,
  cashflowHighlights,
  totalsByBucket,
} from "./cashflow";

const YEAR = { from: "2026-01-01", to: "2026-12-31" };

const ENTRIES = [
  { amountMinor: 100_000, currency: "EUR", date: "2026-01-25", kind: "income" },
  { amountMinor: 30_000, currency: "EUR", date: "2026-01-02", kind: "expense" },
  { amountMinor: 5000, currency: "EUR", date: "2026-03-10", kind: "expense" },
  {
    amountMinor: 120_000,
    currency: "MKD",
    date: "2026-03-01",
    kind: "expense",
  },
  { amountMinor: 999, currency: "EUR", date: "2025-12-31", kind: "income" },
] as const;

describe(cashflowByBucket, () => {
  it("keeps currencies apart, MKD first", () => {
    const result = cashflowByBucket(ENTRIES, YEAR, "month");

    expect(result.map((series) => series.currency)).toStrictEqual([
      "MKD",
      "EUR",
    ]);
  });

  it("sums income, spending and net per month", () => {
    const [, eur] = cashflowByBucket(ENTRIES, YEAR, "month");

    expect(eur?.buckets).toHaveLength(12);
    expect(eur?.buckets[0]).toStrictEqual({
      expenseMinor: 30_000,
      incomeMinor: 100_000,
      key: "2026-01",
      netMinor: 70_000,
    });
    expect(eur?.buckets[2]?.netMinor).toBe(-5000);
  });

  it("totals the range and ignores entries outside it", () => {
    const [, eur] = cashflowByBucket(ENTRIES, YEAR, "month");

    expect(eur?.incomeMinor).toBe(100_000);
    expect(eur?.expenseMinor).toBe(35_000);
    expect(eur?.netMinor).toBe(65_000);
  });

  it("groups by year across a long range", () => {
    const [eur] = cashflowByBucket(
      ENTRIES.filter((entry) => entry.currency === "EUR"),
      { from: "2025-01-01", to: "2026-12-31" },
      "year"
    );

    expect(eur?.buckets.map((bucket) => bucket.key)).toStrictEqual([
      "2025",
      "2026",
    ]);
    expect(eur?.buckets[0]?.incomeMinor).toBe(999);
  });

  it("returns nothing without entries", () => {
    expect(cashflowByBucket([], YEAR, "month")).toStrictEqual([]);
  });
});

describe(cashflowHighlights, () => {
  it("averages per month and finds the best and worst month", () => {
    const monthly = cashflowByBucket(
      ENTRIES,
      { from: "2026-01-01", to: "2026-03-31" },
      "month"
    );

    const [, eur] = cashflowHighlights(monthly);

    expect(eur).toStrictEqual({
      avgExpenseMinor: 11_667,
      avgIncomeMinor: 33_333,
      avgNetMinor: 21_667,
      best: { key: "2026-01", netMinor: 70_000 },
      currency: "EUR",
      months: 3,
      savingsRatePercent: 65,
      worst: { key: "2026-03", netMinor: -5000 },
    });
  });

  it("has no savings rate without income and no best month for one month", () => {
    const monthly = cashflowByBucket(
      ENTRIES,
      { from: "2026-03-01", to: "2026-03-31" },
      "month"
    );

    const [mkd] = cashflowHighlights(monthly);

    expect(mkd?.savingsRatePercent).toBeNull();
    expect(mkd?.best).toBeNull();
  });
});

describe(totalsByBucket, () => {
  it("lines amounts up with the keys", () => {
    expect(
      totalsByBucket(
        [
          { amountMinor: 5, date: "2026-02-03" },
          { amountMinor: 7, date: "2026-02-20" },
          { amountMinor: 1, date: "2027-01-01" },
        ],
        ["2026-01", "2026-02"],
        "month"
      )
    ).toStrictEqual([0, 12]);
  });
});
