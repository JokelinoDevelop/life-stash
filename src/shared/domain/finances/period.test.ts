import { describe, expect, it } from "vitest";

import {
  bucketKey,
  bucketKeys,
  bucketRange,
  monthsInRange,
  pickGranularity,
  previousRange,
  wholeYear,
} from "./period";

describe(monthsInRange, () => {
  it("counts the calendar months a range touches", () => {
    expect(monthsInRange({ from: "2026-01-31", to: "2026-02-01" })).toBe(2);
    expect(monthsInRange({ from: "2025-01-01", to: "2026-12-31" })).toBe(24);
  });
});

describe(pickGranularity, () => {
  it("goes from months to quarters to years as the range grows", () => {
    expect(pickGranularity({ from: "2025-01-01", to: "2026-12-31" })).toBe(
      "month"
    );
    expect(pickGranularity({ from: "2024-12-01", to: "2026-12-31" })).toBe(
      "quarter"
    );
    expect(pickGranularity({ from: "2019-01-01", to: "2026-12-31" })).toBe(
      "year"
    );
  });
});

describe(bucketKey, () => {
  it("names months, quarters and years", () => {
    expect(bucketKey("2026-05-14", "month")).toBe("2026-05");
    expect(bucketKey("2026-05-14", "quarter")).toBe("2026-Q2");
    expect(bucketKey("2026-05-14", "year")).toBe("2026");
  });
});

describe(bucketKeys, () => {
  it("lists every bucket in the range, oldest first", () => {
    expect(
      bucketKeys({ from: "2025-11-15", to: "2026-02-03" }, "month")
    ).toStrictEqual(["2025-11", "2025-12", "2026-01", "2026-02"]);
    expect(
      bucketKeys({ from: "2025-11-15", to: "2026-04-03" }, "quarter")
    ).toStrictEqual(["2025-Q4", "2026-Q1", "2026-Q2"]);
  });
});

describe(bucketRange, () => {
  it("returns the days a bucket covers", () => {
    expect(bucketRange("2024-02")).toStrictEqual({
      from: "2024-02-01",
      to: "2024-02-29",
    });
    expect(bucketRange("2026-Q4")).toStrictEqual({
      from: "2026-10-01",
      to: "2026-12-31",
    });
    expect(bucketRange("2026")).toStrictEqual({
      from: "2026-01-01",
      to: "2026-12-31",
    });
  });
});

describe(previousRange, () => {
  it("steps a year back by a year", () => {
    expect(
      previousRange({ from: "2026-01-01", to: "2026-12-31" })
    ).toStrictEqual({ from: "2025-01-01", to: "2025-12-31" });
  });

  it("steps the last 12 months back by 12 months", () => {
    expect(
      previousRange({ from: "2025-12-01", to: "2026-11-27" })
    ).toStrictEqual({ from: "2024-12-01", to: "2025-11-27" });
  });

  it("steps other ranges back by their length in days", () => {
    expect(
      previousRange({ from: "2026-03-10", to: "2026-03-19" })
    ).toStrictEqual({ from: "2026-02-28", to: "2026-03-09" });
  });
});

describe(wholeYear, () => {
  it("recognises a calendar year", () => {
    expect(wholeYear({ from: "2026-01-01", to: "2026-12-31" })).toBe(2026);
    expect(wholeYear({ from: "2026-01-01", to: "2026-11-30" })).toBeNull();
  });
});
