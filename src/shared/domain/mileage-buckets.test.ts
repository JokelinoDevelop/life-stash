import { describe, expect, it } from "vitest";

import {
  averagePerMonth,
  distancePerMonth,
  odometerByMonth,
} from "./mileage-buckets";

const points = [
  { date: "2026-08-15", odometerKm: 100_000 },
  { date: "2026-09-10", odometerKm: 101_200 },
  { date: "2026-11-01", odometerKm: 103_000 },
];

describe("mileage buckets", () => {
  it("spreads distance over the months between readings", () => {
    const result = distancePerMonth(points, "2026-11-18", 4);
    expect(result).toStrictEqual([
      { km: 738, month: "2026-08" },
      { km: 1154, month: "2026-09" },
      { km: 1073, month: "2026-10" },
      { km: 35, month: "2026-11" },
    ]);
  });

  it("averages distance per month", () => {
    expect(averagePerMonth(points)).toBe(1171);
    expect(averagePerMonth(points.slice(0, 1))).toBeNull();
  });
});

describe(odometerByMonth, () => {
  it("carries the latest known odometer forward and is null before the first", () => {
    const result = odometerByMonth(
      [
        { date: "2026-09-10", odometerKm: 140_000 },
        { date: "2026-11-16", odometerKm: 142_380 },
      ],
      "2026-11-19",
      4
    );

    expect(result).toStrictEqual([
      { month: "2026-08", odometerKm: null },
      { month: "2026-09", odometerKm: 140_000 },
      { month: "2026-10", odometerKm: 140_000 },
      { month: "2026-11", odometerKm: 142_380 },
    ]);
  });
});
