import { describe, expect, it } from "vitest";

import { effectiveVisitTotal, personalSpendingByYear } from "./spending";

describe("spending", () => {
  it("prefers the invoice total and falls back to item costs", () => {
    const base = {
      byPreviousOwner: false,
      currency: "MKD" as const,
      date: "2026-01-01",
    };

    expect(
      effectiveVisitTotal({ ...base, itemCostsMinor: [100], totalMinor: 500 })
    ).toBe(500);
    expect(
      effectiveVisitTotal({
        ...base,
        itemCostsMinor: [100, null, 50],
        totalMinor: null,
      })
    ).toBe(150);
    expect(
      effectiveVisitTotal({ ...base, itemCostsMinor: [null], totalMinor: null })
    ).toBeNull();
  });

  it("excludes previous-owner work and groups by year and currency", () => {
    const totals = personalSpendingByYear([
      {
        byPreviousOwner: false,
        currency: "MKD",
        date: "2026-02-01",
        itemCostsMinor: [],
        totalMinor: 1000,
      },
      {
        byPreviousOwner: false,
        currency: "MKD",
        date: "2026-05-01",
        itemCostsMinor: [],
        totalMinor: 500,
      },
      {
        byPreviousOwner: false,
        currency: "EUR",
        date: "2026-05-01",
        itemCostsMinor: [],
        totalMinor: 70,
      },
      {
        byPreviousOwner: true,
        currency: "MKD",
        date: "2026-01-01",
        itemCostsMinor: [],
        totalMinor: 9999,
      },
      {
        byPreviousOwner: false,
        currency: "MKD",
        date: "2025-01-01",
        itemCostsMinor: [],
        totalMinor: 200,
      },
    ]);

    expect(totals).toStrictEqual([
      { amountMinor: 70, currency: "EUR", year: 2026 },
      { amountMinor: 1500, currency: "MKD", year: 2026 },
      { amountMinor: 200, currency: "MKD", year: 2025 },
    ]);
  });
});
