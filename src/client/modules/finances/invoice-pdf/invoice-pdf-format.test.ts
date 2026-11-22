import { describe, expect, it } from "vitest";

import { invoicePdfFormat } from "./invoice-pdf-format";

describe(invoicePdfFormat, () => {
  it("prints the work period compactly within a year", () => {
    const format = invoicePdfFormat("en");

    expect(format.period("2026-11-01", "2026-11-30")).toBe("01.11–30.11.2026");
    expect(format.period("2025-12-15", "2026-01-14")).toBe(
      "15.12.2025–14.01.2026"
    );
    expect(format.period("2026-11-01", null)).toBe("01.11.2026");
  });

  it("prints quantities with their unit and VAT rates as percent", () => {
    expect(invoicePdfFormat("en").quantity(80_000, "hrs")).toBe("80 hrs");
    expect(invoicePdfFormat("mk").quantity(1500, "ч.")).toBe("1,5 ч.");
    expect(invoicePdfFormat("en").quantity(1000, null)).toBe("1");
    expect(invoicePdfFormat("en").rate(1800)).toBe("18%");
    expect(invoicePdfFormat("en").rate(550)).toBe("5.5%");
  });

  it("prints money in the invoice language with two decimals", () => {
    expect(invoicePdfFormat("en").money(322_500, "EUR")).toBe("€3,225.00");
    expect(invoicePdfFormat("en").amount(200_000)).toBe("2,000.00");
    expect(invoicePdfFormat("en").date("2026-11-20")).toBe("20.11.2026");
  });
});
