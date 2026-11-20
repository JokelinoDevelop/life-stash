import { describe, expect, it } from "vitest";

import { convertMinor, totalInCurrency } from "./exchange";
import type { ExchangeRates } from "./exchange";

const RATES: ExchangeRates = { base: "MKD", rates: { EUR: 61.5, USD: 57 } };

describe(convertMinor, () => {
  it("converts into and out of the base currency", () => {
    expect(convertMinor(10_000, "EUR", "MKD", RATES)).toBe(615_000);
    expect(convertMinor(615_000, "MKD", "EUR", RATES)).toBe(10_000);
  });

  it("converts between two non-base currencies through the base", () => {
    expect(convertMinor(5700, "USD", "EUR", RATES)).toBe(5283);
  });

  it("returns null when a rate is missing", () => {
    expect(
      convertMinor(100, "USD", "MKD", { base: "MKD", rates: {} })
    ).toBeNull();
  });
});

describe(totalInCurrency, () => {
  it("adds every currency in the main one", () => {
    expect(
      totalInCurrency(
        [
          { amountMinor: 132_000_000, currency: "MKD" },
          { amountMinor: 5_375_000, currency: "EUR" },
        ],
        "MKD",
        RATES
      )
    ).toBe(462_562_500);
  });

  it("gives up when one currency has no rate", () => {
    expect(
      totalInCurrency([{ amountMinor: 100, currency: "USD" }], "MKD", {
        base: "MKD",
        rates: { EUR: 61.5 },
      })
    ).toBeNull();
  });
});
