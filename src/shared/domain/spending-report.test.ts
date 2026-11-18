import { describe, expect, it } from "vitest";

import { spendingByYear } from "./spending-report";

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
