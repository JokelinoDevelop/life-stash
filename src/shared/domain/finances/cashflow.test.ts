import { describe, expect, it } from "vitest";

import { monthlyCashflow } from "./cashflow";

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

describe(monthlyCashflow, () => {
  it("keeps currencies apart, MKD first", () => {
    const result = monthlyCashflow(ENTRIES, 2026);

    expect(result.map((series) => series.currency)).toStrictEqual([
      "MKD",
      "EUR",
    ]);
  });

  it("sums income, spending and net per month", () => {
    const [, eur] = monthlyCashflow(ENTRIES, 2026);

    expect(eur?.months).toHaveLength(12);
    expect(eur?.months[0]).toStrictEqual({
      expenseMinor: 30_000,
      incomeMinor: 100_000,
      month: 1,
      netMinor: 70_000,
    });
    expect(eur?.months[2]?.netMinor).toBe(-5000);
  });

  it("totals the year and ignores other years", () => {
    const [, eur] = monthlyCashflow(ENTRIES, 2026);

    expect(eur?.incomeMinor).toBe(100_000);
    expect(eur?.expenseMinor).toBe(35_000);
    expect(eur?.netMinor).toBe(65_000);
  });

  it("returns nothing for a year without entries", () => {
    expect(monthlyCashflow([], 2026)).toStrictEqual([]);
  });
});
