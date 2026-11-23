import { describe, expect, it } from "vitest";

import { carTint } from "./car-tint";

describe(carTint, () => {
  it("is stable for the same name, ignoring case and spaces", () => {
    expect(carTint("Clio")).toBe(carTint(" clio "));
  });

  it("never picks the neutral tint", () => {
    for (const name of ["Clio", "Golf", "Model 3", "Yaris", "", "Ä"]) {
      expect(carTint(name)).not.toBe("slate");
    }
  });

  it("spreads different names over several tints", () => {
    const tints = new Set(
      [
        "Clio",
        "Golf",
        "Octavia",
        "Yaris",
        "Civic",
        "Corsa",
        "Focus",
        "Polo",
      ].map(carTint)
    );

    expect(tints.size).toBeGreaterThan(2);
  });
});
