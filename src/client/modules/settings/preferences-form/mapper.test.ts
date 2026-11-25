import { describe, expect, it } from "vitest";

import { preferencesToRequest, undoPatch } from "./mapper";
import type { Preferences } from "./mapper";

const current: Preferences = {
  currency: "MKD",
  displayName: "Demo",
  distanceUnit: "km",
  locale: "en",
  odometerNudgeWeeks: 4,
  timeZone: "Europe/Skopje",
};

describe("preferences mapper", () => {
  it("applies one change on top of the current preferences", () => {
    expect(
      preferencesToRequest(current, { displayName: "  Jovan ", locale: "mk" })
    ).toStrictEqual({
      currency: "MKD",
      displayName: "Jovan",
      distanceUnit: "km",
      locale: "mk",
      odometerNudgeWeeks: 4,
      timeZone: "Europe/Skopje",
    });
  });

  it("builds the undo of a change from the current values", () => {
    expect(undoPatch(current, { currency: "EUR", locale: "mk" })).toStrictEqual(
      { currency: "MKD", locale: "en" }
    );
  });
});
