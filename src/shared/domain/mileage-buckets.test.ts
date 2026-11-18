import { describe, expect, it } from "vitest";

import { averagePerMonth, distancePerMonth } from "./mileage-buckets";

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
