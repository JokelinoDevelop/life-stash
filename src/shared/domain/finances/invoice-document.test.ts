import { describe, expect, it } from "vitest";

import {
  invoiceFileName,
  invoiceTotals,
  lineAmounts,
} from "./invoice-document";

describe(lineAmounts, () => {
  it("multiplies quantity by unit price", () => {
    expect(
      lineAmounts({ quantityMilli: 80_000, unitPriceMinor: 4000, vatRateBp: 0 })
    ).toStrictEqual({ amountMinor: 320_000, vatMinor: 0 });
  });

  it("rounds the amount and the VAT half-up to the minor unit", () => {
    // 1.5 × 0.33 = 0.495 → 0.50; 18% of 0.50 = 0.09
    expect(
      lineAmounts({ quantityMilli: 1500, unitPriceMinor: 33, vatRateBp: 1800 })
    ).toStrictEqual({ amountMinor: 50, vatMinor: 9 });
    // 0.333 × 1.00 = 0.333 → 0.33
    expect(
      lineAmounts({ quantityMilli: 333, unitPriceMinor: 100, vatRateBp: 0 })
    ).toStrictEqual({ amountMinor: 33, vatMinor: 0 });
  });

  it("stays exact for large amounts", () => {
    expect(
      lineAmounts({
        quantityMilli: 99_999_999,
        unitPriceMinor: 999_999_999,
        vatRateBp: 0,
      }).amountMinor
    ).toBe(99_999_998_900_000);
  });
});

describe(invoiceTotals, () => {
  it("sums lines and groups VAT per rate", () => {
    const lines = [
      { amountMinor: 10_000, vatMinor: 1800, vatRateBp: 1800 },
      { amountMinor: 5000, vatMinor: 250, vatRateBp: 500 },
      { amountMinor: 2000, vatMinor: 360, vatRateBp: 1800 },
    ];

    expect(invoiceTotals(lines)).toStrictEqual({
      subtotalMinor: 17_000,
      totalMinor: 19_410,
      vatByRate: [
        { baseMinor: 5000, rateBp: 500, vatMinor: 250 },
        { baseMinor: 12_000, rateBp: 1800, vatMinor: 2160 },
      ],
      vatMinor: 2410,
    });
  });

  it("is zero without lines", () => {
    expect(invoiceTotals([])).toStrictEqual({
      subtotalMinor: 0,
      totalMinor: 0,
      vatByRate: [],
      vatMinor: 0,
    });
  });
});

describe(invoiceFileName, () => {
  it("names the file in the invoice language", () => {
    expect(invoiceFileName("2026-012", "en")).toBe("Invoice-2026-012.pdf");
    expect(invoiceFileName("2026/012", "mk")).toBe("Faktura-2026-012.pdf");
  });
});
