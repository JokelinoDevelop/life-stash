import { describe, expect, it } from "vitest";

import { weightFormDefaults, weightFormToRequest } from "./mapper";

describe(weightFormToRequest, () => {
  it("stores kilograms as grams, comma or dot", () => {
    expect(
      weightFormToRequest({ date: "2026-11-24", kg: "81,45", note: " " })
    ).toStrictEqual({ date: "2026-11-24", note: null, weightGrams: 81_450 });
    expect(
      weightFormToRequest({ date: "2026-11-24", kg: "80.1", note: "Morning" })
        .weightGrams
    ).toBe(80_100);
  });

  it("prefills the last weight", () => {
    expect(
      weightFormDefaults({ date: "2026-11-24", lastGrams: 81_400 }).kg
    ).toBe("81.4");
  });
});
