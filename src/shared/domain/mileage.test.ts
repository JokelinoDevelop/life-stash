import { describe, expect, it } from "vitest";

import {
  distancePerYear,
  latestOdometer,
  totalDistance,
  withDeltas,
} from "./mileage";

const readings = [
  { date: "2025-12-01", odometerKm: 100_000 },
  { date: "2026-03-01", odometerKm: 104_000 },
  { date: "2025-06-01", odometerKm: 95_000 },
];

describe("mileage", () => {
  it("finds the latest reading", () => {
    expect(latestOdometer(readings)?.odometerKm).toBe(104_000);
    expect(latestOdometer([])).toBeNull();
  });

  it("computes deltas in chronological order", () => {
    expect(
      withDeltas(readings).map((entry) => entry.kmSincePrevious)
    ).toStrictEqual([null, 5000, 4000]);
  });

  it("spreads a long gap across the years it covers", () => {
    const purchaseThenLog = [
      { date: "2024-12-31", odometerKm: 10_000 },
      { date: "2026-12-31", odometerKm: 30_000 },
    ];

    expect(distancePerYear(purchaseThenLog)).toStrictEqual([
      { km: 10_000, year: 2025 },
      { km: 10_000, year: 2026 },
    ]);
  });

  it("sums distance per year and in total", () => {
    expect(distancePerYear(readings)).toStrictEqual([
      { km: 6333, year: 2025 },
      { km: 2667, year: 2026 },
    ]);
    expect(totalDistance(readings)).toBe(9000);
  });
});
