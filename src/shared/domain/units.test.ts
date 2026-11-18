import { describe, expect, it } from "vitest";

import { sumByCurrency, toMajor, toMinor } from "./money";
import { displayToKm, kmToDisplay } from "./units";

describe("units and money", () => {
  it("converts distances for display and storage", () => {
    expect(kmToDisplay(160_934, "mi")).toBe(100_000);
    expect(displayToKm(100_000, "mi")).toBe(160_934);
    expect(kmToDisplay(1234, "km")).toBe(1234);
  });

  it("handles minor units and per-currency sums", () => {
    expect(toMinor(1250.5)).toBe(125_050);
    expect(toMajor(125_050)).toBe(1250.5);
    expect(
      sumByCurrency([
        { amountMinor: 100, currency: "EUR" },
        { amountMinor: 300, currency: "MKD" },
        { amountMinor: 50, currency: "EUR" },
      ])
    ).toStrictEqual([
      { amountMinor: 300, currency: "MKD" },
      { amountMinor: 150, currency: "EUR" },
    ]);
  });
});
