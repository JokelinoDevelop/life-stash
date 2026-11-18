import { describe, expect, it } from "vitest";

import { groupByMonth, totalsByCategory } from "./group-expenses";

const expenses = [
  {
    amountMinor: 300,
    category: "fuel" as const,
    currency: "MKD" as const,
    date: "2026-11-10",
  },
  {
    amountMinor: 200,
    category: "parking" as const,
    currency: "MKD" as const,
    date: "2026-11-02",
  },
  {
    amountMinor: 100,
    category: "fuel" as const,
    currency: "MKD" as const,
    date: "2026-10-20",
  },
  {
    amountMinor: 50,
    category: "fuel" as const,
    currency: "EUR" as const,
    date: "2025-10-20",
  },
];

describe("expense grouping", () => {
  it("groups by month with per-currency totals", () => {
    const groups = groupByMonth(expenses);
    expect(groups.map((group) => group.month)).toStrictEqual([
      "2026-11",
      "2026-10",
      "2025-10",
    ]);
    expect(groups[0]?.totals).toStrictEqual([
      { amountMinor: 500, currency: "MKD" },
    ]);
  });

  it("totals categories for one year only", () => {
    expect(totalsByCategory(expenses, 2026)).toStrictEqual([
      { category: "fuel", totals: [{ amountMinor: 400, currency: "MKD" }] },
      { category: "parking", totals: [{ amountMinor: 200, currency: "MKD" }] },
    ]);
  });
});
