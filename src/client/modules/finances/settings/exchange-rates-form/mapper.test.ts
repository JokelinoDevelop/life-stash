import { describe, expect, it } from "vitest";

import { exchangeRatesFormToRequest, ratesToFormValues } from "./mapper";

describe(ratesToFormValues, () => {
  it("shows rates against the main currency even when stored in another base", () => {
    expect(
      ratesToFormValues({ base: "MKD", rates: { EUR: 61.5, USD: 56.5 } }, "EUR")
    ).toStrictEqual({ EUR: "", MKD: "0.0163", USD: "0.9187" });
  });

  it("leaves unknown rates blank", () => {
    expect(ratesToFormValues({ base: "MKD", rates: {} }, "MKD")).toStrictEqual({
      EUR: "",
      MKD: "",
      USD: "",
    });
  });
});

describe(exchangeRatesFormToRequest, () => {
  it("stores the typed rates against the main currency", () => {
    expect(
      exchangeRatesFormToRequest({ EUR: "61,5", MKD: "", USD: "" }, "MKD")
    ).toStrictEqual({ exchangeRates: { base: "MKD", rates: { EUR: 61.5 } } });
  });
});
