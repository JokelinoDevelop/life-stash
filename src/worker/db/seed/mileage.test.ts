import { addDays } from "@shared/domain/dates";
import { describe, expect, it } from "vitest";

import { createMileage } from "./mileage";

const odometerOn = createMileage({
  from: "2022-01-01",
  kmPerYear: 12_000,
  startKm: 50_000,
  until: "2025-01-01",
});

describe(createMileage, () => {
  it("starts at the purchase odometer", () => {
    expect(odometerOn("2022-01-01")).toBe(50_000);
  });

  it("never goes down", () => {
    let previous = 0;

    for (let day = 0; day <= 1096; day += 5) {
      const km = odometerOn(addDays("2022-01-01", day));
      expect(km).toBeGreaterThanOrEqual(previous);
      previous = km;
    }
  });

  it("adds roughly kmPerYear each year", () => {
    const driven = odometerOn("2023-01-01") - odometerOn("2022-01-01");
    expect(driven).toBeGreaterThan(11_800);
    expect(driven).toBeLessThan(12_200);
  });

  it("drives more in summer than in winter", () => {
    const july = odometerOn("2023-08-01") - odometerOn("2023-07-01");
    const january = odometerOn("2023-02-01") - odometerOn("2023-01-01");
    expect(july).toBeGreaterThan(january);
  });

  it("clamps outside the ownership window", () => {
    expect(odometerOn("2020-06-01")).toBe(50_000);
    expect(odometerOn("2030-01-01")).toBe(odometerOn("2025-01-01"));
  });
});
