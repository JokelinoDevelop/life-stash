import { describe, expect, it } from "vitest";

import { receivedAmountFor } from "./mapper";

const INVOICE = { amountMinor: 90_000, currency: "USD" as const };

describe(receivedAmountFor, () => {
  it("clears the prefilled invoice amount when the money arrived in another currency", () => {
    expect(receivedAmountFor(INVOICE, "EUR", "900.00")).toBe("");
  });

  it("keeps an amount the user typed", () => {
    expect(receivedAmountFor(INVOICE, "EUR", "780.00")).toBe("780.00");
    expect(receivedAmountFor(INVOICE, "USD", "780.00")).toBe("780.00");
  });

  it("fills the invoice amount again when switching back to an empty field", () => {
    expect(receivedAmountFor(INVOICE, "USD", "")).toBe("900.00");
  });
});
