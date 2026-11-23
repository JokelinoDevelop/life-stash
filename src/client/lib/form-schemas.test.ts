import { describe, expect, it } from "vitest";

import { parseAmount } from "./form-schemas";

describe(parseAmount, () => {
  it("reads dot or comma decimals and ignores spaces", () => {
    expect(parseAmount("12,50")).toBe(12.5);
    expect(parseAmount(" 1 234.56 ")).toBeCloseTo(1234.56);
  });

  it("is null when empty", () => {
    expect(parseAmount("")).toBeNull();
    expect(parseAmount("   ")).toBeNull();
  });

  it("is null for anything that isn't a finite number yet", () => {
    for (const typed of ["40€", "1.000,00", "12a", "abc", "1e999", "."]) {
      expect(parseAmount(typed)).toBeNull();
    }
  });
});
