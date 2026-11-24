import { describe, expect, it } from "vitest";

import { gramsToKg, kgToGrams, weightChange } from "./weight";

describe(kgToGrams, () => {
  it("converts both ways", () => {
    expect(kgToGrams(81.45)).toBe(81_450);
    expect(kgToGrams(80.0004)).toBe(80_000);
    expect(gramsToKg(81_450)).toBeCloseTo(81.45, 5);
  });
});

describe(weightChange, () => {
  const entries = [
    { date: "2026-10-20", weightGrams: 84_000 },
    { date: "2026-11-10", weightGrams: 82_500 },
    { date: "2026-11-17", weightGrams: 82_000 },
    { date: "2026-11-24", weightGrams: 81_400 },
  ];

  it("compares the latest entry with the one on or before N days earlier", () => {
    expect(weightChange(entries, 7)).toBe(-600);
    expect(weightChange(entries, 30)).toBe(-2600);
  });

  it("is null without enough history", () => {
    expect(weightChange(entries, 60)).toBeNull();
    expect(weightChange([], 7)).toBeNull();
  });
});
