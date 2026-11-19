import { describe, expect, it } from "vitest";

import { percentChange, splitTotals, subtractTotals } from "./money-split";

describe(splitTotals, () => {
  it("puts the main currency first and keeps the rest", () => {
    expect(
      splitTotals(
        [
          { amountMinor: 1, currency: "MKD" },
          { amountMinor: 2, currency: "EUR" },
        ],
        "EUR"
      )
    ).toStrictEqual({
      others: [{ amountMinor: 1, currency: "MKD" }],
      primary: { amountMinor: 2, currency: "EUR" },
    });
  });
});

describe(subtractTotals, () => {
  it("subtracts per currency", () => {
    expect(
      subtractTotals(
        [{ amountMinor: 10, currency: "EUR" }],
        [
          { amountMinor: 4, currency: "EUR" },
          { amountMinor: 3, currency: "MKD" },
        ]
      )
    ).toStrictEqual([
      { amountMinor: 6, currency: "EUR" },
      { amountMinor: -3, currency: "MKD" },
    ]);
  });
});

describe(percentChange, () => {
  it("rounds the change and needs a base", () => {
    expect(percentChange(109, 100)).toBe(9);
    expect(percentChange(5, 0)).toBeNull();
  });
});
