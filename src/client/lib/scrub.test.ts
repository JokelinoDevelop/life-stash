import { describe, expect, it } from "vitest";

import { scrubIndex } from "./scrub";

describe(scrubIndex, () => {
  it("maps a position to its column", () => {
    expect(scrubIndex(0, 120, 12)).toBe(0);
    expect(scrubIndex(15, 120, 12)).toBe(1);
    expect(scrubIndex(119, 120, 12)).toBe(11);
  });

  it("clamps outside the chart", () => {
    expect(scrubIndex(-30, 120, 12)).toBe(0);
    expect(scrubIndex(500, 120, 12)).toBe(11);
  });

  it("is 0 for an empty or unmeasured chart", () => {
    expect(scrubIndex(10, 0, 12)).toBe(0);
    expect(scrubIndex(10, 120, 0)).toBe(0);
  });
});
