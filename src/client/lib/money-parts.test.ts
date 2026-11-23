import { describe, expect, it } from "vitest";

import { splitMoneyParts } from "./money-parts";

const parts = (locale: string, currency: string, value: number) =>
  splitMoneyParts(
    new Intl.NumberFormat(locale, {
      currency,
      maximumFractionDigits: currency === "MKD" ? 0 : 2,
      minimumFractionDigits: 0,
      style: "currency",
    }).formatToParts(value)
  );

describe(splitMoneyParts, () => {
  it("keeps a leading code and its space together", () => {
    expect(parts("en-GB", "MKD", 144_296)).toStrictEqual([
      { kind: "currency", text: "MKD " },
      { kind: "figure", text: "144,296" },
    ]);
  });

  it("handles a symbol with no space", () => {
    expect(parts("en-GB", "EUR", 9383.5)).toStrictEqual([
      { kind: "currency", text: "€" },
      { kind: "figure", text: "9,383.5" },
    ]);
  });

  it("moves the space before a trailing currency into the currency", () => {
    const result = parts("mk-MK", "MKD", 1170);

    expect(result.map((part) => part.kind)).toStrictEqual([
      "figure",
      "currency",
    ]);
    expect(result[0]?.text).toBe("1.170");
    expect(result[1]?.text.trim()).toBe("ден.");
  });

  it("keeps the minus sign with the figure", () => {
    const result = parts("en-GB", "EUR", -46.2);

    expect(result).toStrictEqual([
      { kind: "figure", text: "-" },
      { kind: "currency", text: "€" },
      { kind: "figure", text: "46.2" },
    ]);
  });
});
