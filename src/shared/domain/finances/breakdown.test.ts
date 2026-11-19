import { describe, expect, it } from "vitest";

import { categoryBreakdown } from "./breakdown";

describe(categoryBreakdown, () => {
  const range = { from: "2026-01-01", to: "2026-12-31" };

  it("totals per category, largest first, with the share of the currency total", () => {
    const result = categoryBreakdown(
      [
        {
          amountMinor: 60_000,
          categoryId: "rent",
          currency: "EUR",
          date: "2026-02-01",
        },
        {
          amountMinor: 20_000,
          categoryId: "food",
          currency: "EUR",
          date: "2026-02-03",
        },
        {
          amountMinor: 20_000,
          categoryId: "food",
          currency: "EUR",
          date: "2026-03-03",
        },
        {
          amountMinor: 5000,
          categoryId: "food",
          currency: "MKD",
          date: "2026-03-03",
        },
        {
          amountMinor: 1,
          categoryId: "rent",
          currency: "EUR",
          date: "2025-12-31",
        },
      ],
      range
    );

    expect(result).toStrictEqual([
      {
        amountMinor: 5000,
        categoryId: "food",
        currency: "MKD",
        sharePercent: 100,
      },
      {
        amountMinor: 60_000,
        categoryId: "rent",
        currency: "EUR",
        sharePercent: 60,
      },
      {
        amountMinor: 40_000,
        categoryId: "food",
        currency: "EUR",
        sharePercent: 40,
      },
    ]);
  });

  it("rounds shares to one decimal", () => {
    const result = categoryBreakdown(
      [
        {
          amountMinor: 1,
          categoryId: "a",
          currency: "EUR",
          date: "2026-01-01",
        },
        {
          amountMinor: 2,
          categoryId: "b",
          currency: "EUR",
          date: "2026-01-01",
        },
      ],
      range
    );

    expect(result.map((share) => share.sharePercent)).toStrictEqual([
      66.7, 33.3,
    ]);
  });
});
