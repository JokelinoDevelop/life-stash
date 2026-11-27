import { describe, expect, it } from "vitest";

import {
  spendingByMonth,
  spendingByYear,
  spendingEntries,
} from "./spending-report";

describe(spendingByYear, () => {
  it("splits maintenance, repairs and other costs per year and currency", () => {
    const result = spendingByYear(
      [
        {
          byPreviousOwner: false,
          currency: "MKD",
          date: "2026-02-01",
          itemCostsMinor: [],
          kind: "maintenance",
          totalMinor: 1000,
        },
        {
          byPreviousOwner: false,
          currency: "MKD",
          date: "2026-03-01",
          itemCostsMinor: [200, 300],
          kind: "repair",
          totalMinor: null,
        },
        {
          byPreviousOwner: true,
          currency: "MKD",
          date: "2026-01-01",
          itemCostsMinor: [],
          kind: "repair",
          totalMinor: 9999,
        },
        {
          byPreviousOwner: false,
          currency: "EUR",
          date: "2025-06-01",
          itemCostsMinor: [],
          kind: "maintenance",
          totalMinor: 70,
        },
      ],
      [
        {
          amountMinor: 400,
          category: "fuel",
          currency: "MKD",
          date: "2026-04-01",
        },
        {
          amountMinor: 100,
          category: "insurance",
          currency: "MKD",
          date: "2026-05-01",
        },
        {
          amountMinor: 50,
          category: "fuel",
          currency: "MKD",
          date: "2026-06-01",
        },
      ]
    );

    expect(result).toStrictEqual([
      {
        currency: "MKD",
        maintenanceMinor: 1000,
        otherByCategory: [
          { amountMinor: 450, category: "fuel" },
          { amountMinor: 100, category: "insurance" },
        ],
        otherMinor: 550,
        repairMinor: 500,
        year: 2026,
      },
      {
        currency: "EUR",
        maintenanceMinor: 70,
        otherByCategory: [],
        otherMinor: 0,
        repairMinor: 0,
        year: 2025,
      },
    ]);
  });
});

describe(spendingByMonth, () => {
  it("sums visits and expenses per month of one year, skipping previous owners", () => {
    const visit = {
      byPreviousOwner: false,
      currency: "EUR" as const,
      itemCostsMinor: [],
      kind: "maintenance" as const,
    };

    const result = spendingByMonth(
      [
        { ...visit, date: "2026-06-14", totalMinor: 56_800 },
        {
          ...visit,
          byPreviousOwner: true,
          date: "2026-06-01",
          totalMinor: 999,
        },
        { ...visit, date: "2025-06-14", totalMinor: 100 },
      ],
      [
        {
          amountMinor: 6200,
          category: "fuel",
          currency: "EUR",
          date: "2026-06-20",
        },
        {
          amountMinor: 300,
          category: "parking",
          currency: "MKD",
          date: "2026-11-05",
        },
      ],
      2026
    );

    expect(result).toStrictEqual([
      { amountMinor: 63_000, currency: "EUR", month: "2026-06" },
      { amountMinor: 300, currency: "MKD", month: "2026-11" },
    ]);
  });
});

describe(spendingEntries, () => {
  it("lists dated costs, skipping previous owners", () => {
    const visit = {
      byPreviousOwner: false,
      currency: "EUR" as const,
      itemCostsMinor: [],
      kind: "repair" as const,
    };

    expect(
      spendingEntries(
        [
          { ...visit, date: "2026-06-14", totalMinor: 500 },
          {
            ...visit,
            byPreviousOwner: true,
            date: "2020-01-01",
            totalMinor: 9,
          },
        ],
        [
          {
            amountMinor: 300,
            category: "parking",
            currency: "MKD",
            date: "2026-11-05",
          },
        ]
      )
    ).toStrictEqual([
      { amountMinor: 500, currency: "EUR", date: "2026-06-14" },
      { amountMinor: 300, currency: "MKD", date: "2026-11-05" },
    ]);
  });
});
