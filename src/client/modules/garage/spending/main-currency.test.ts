import { describe, expect, it } from "vitest";

import { mainCurrency } from "./main-currency";

describe(mainCurrency, () => {
  it("prefers the user's currency when it is used", () => {
    expect(
      mainCurrency([{ currency: "EUR" }, { currency: "MKD" }], "MKD")
    ).toBe("MKD");
  });

  it("falls back to the most used currency", () => {
    expect(
      mainCurrency(
        [{ currency: "EUR" }, { currency: "EUR" }, { currency: "USD" }],
        "MKD"
      )
    ).toBe("EUR");
    expect(mainCurrency([], "USD")).toBe("USD");
  });
});
