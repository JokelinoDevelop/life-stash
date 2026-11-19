import { describe, expect, it } from "vitest";

import {
  addMonths,
  daysBetween,
  formatPartialDate,
  formatShortDate,
  isIsoDate,
  normalizePartialDate,
  parseTypedDate,
  todayInTimeZone,
} from "./dates";

describe("partial dates", () => {
  it("normalises month and year precision so they sort", () => {
    expect(normalizePartialDate("day", { day: 9, month: 3, year: 2021 })).toBe(
      "2021-03-09"
    );
    expect(
      normalizePartialDate("month", { day: 9, month: 3, year: 2021 })
    ).toBe("2021-03-01");
    expect(normalizePartialDate("year", { month: 3, year: 2021 })).toBe(
      "2021-01-01"
    );
  });

  it("formats only the known part as day.month.year", () => {
    expect(formatPartialDate("2026-11-18")).toBe("18.11.2026");
    expect(formatPartialDate("2026-11-01", "month")).toBe("11.2026");
    expect(formatPartialDate("2026-01-01", "year")).toBe("2026");
  });

  it("validates real calendar dates", () => {
    expect(isIsoDate("2024-02-29")).toBeTruthy();
    expect(isIsoDate("2023-02-29")).toBeFalsy();
    expect(isIsoDate("2023-2-1")).toBeFalsy();
  });
});

describe("date arithmetic", () => {
  it("clamps month addition to the end of the month", () => {
    expect(addMonths("2025-01-31", 1)).toBe("2025-02-28");
    expect(addMonths("2025-11-15", 12)).toBe("2026-11-15");
  });

  it("counts days in both directions", () => {
    expect(daysBetween("2026-11-18", "2026-11-25")).toBe(7);
    expect(daysBetween("2026-11-25", "2026-11-18")).toBe(-7);
  });

  it("computes today in a time zone", () => {
    const lateUtc = new Date("2026-11-18T23:30:00Z");
    expect(todayInTimeZone("Europe/Skopje", lateUtc)).toBe("2026-11-19");
    expect(todayInTimeZone("UTC", lateUtc)).toBe("2026-11-18");
  });
});

describe(parseTypedDate, () => {
  it("accepts ISO and day-first dates", () => {
    expect(parseTypedDate("2026-11-19")).toBe("2026-11-19");
    expect(parseTypedDate(" 19.11.2026 ")).toBe("2026-11-19");
    expect(parseTypedDate("3/2/2024")).toBe("2024-02-03");
    expect(parseTypedDate("03-02-2024")).toBe("2024-02-03");
  });

  it("rejects impossible or partial dates", () => {
    expect(parseTypedDate("31.02.2024")).toBeNull();
    expect(parseTypedDate("19.11.26")).toBeNull();
    expect(parseTypedDate("tomorrow")).toBeNull();
    expect(parseTypedDate("")).toBeNull();
  });
});

describe(formatShortDate, () => {
  it("drops the year from full dates", () => {
    expect(formatShortDate("2026-07-09")).toBe("09.07");
  });

  it("keeps month and year precision as they are", () => {
    expect(formatShortDate("2026-07-01", "month")).toBe("07.2026");
    expect(formatShortDate("2026-01-01", "year")).toBe("2026");
  });
});
