import { describe, expect, it } from "vitest";

import {
  deriveStatus,
  expandSchedule,
  isoWeekday,
  mergeOccurrences,
  normalizeWeekdays,
  startOfIsoWeek,
} from "./schedule";
import type { StoredOccurrence } from "./schedule";

const MON_THU = [1, 4];

describe(isoWeekday, () => {
  it("numbers Monday 1 to Sunday 7", () => {
    expect(isoWeekday("2026-11-23")).toBe(1);
    expect(isoWeekday("2026-11-26")).toBe(4);
    expect(isoWeekday("2026-11-29")).toBe(7);
  });

  it("finds the Monday of the week", () => {
    expect(startOfIsoWeek("2026-11-29")).toBe("2026-11-23");
    expect(startOfIsoWeek("2026-11-23")).toBe("2026-11-23");
    expect(startOfIsoWeek("2027-01-01")).toBe("2026-12-28");
  });

  it("normalises weekdays", () => {
    expect(normalizeWeekdays([4, 1, 4, 9])).toStrictEqual([1, 4]);
  });
});

describe(expandSchedule, () => {
  it("lists the rule's days inside the range", () => {
    expect(
      expandSchedule(
        { endDate: null, startDate: "2026-11-01", weekdays: MON_THU },
        "2026-11-23",
        "2026-12-06"
      )
    ).toStrictEqual(["2026-11-23", "2026-11-26", "2026-11-30", "2026-12-03"]);
  });

  it("respects the start and end dates", () => {
    expect(
      expandSchedule(
        { endDate: "2026-11-30", startDate: "2026-11-24", weekdays: MON_THU },
        "2026-11-01",
        "2026-12-31"
      )
    ).toStrictEqual(["2026-11-26", "2026-11-30"]);
  });

  it("reaches months ahead without anything stored", () => {
    const dates = expandSchedule(
      { endDate: null, startDate: "2026-11-24", weekdays: MON_THU },
      "2027-03-01",
      "2027-03-31"
    );

    expect(dates).toHaveLength(9);
    expect(dates[0]).toBe("2027-03-01");
  });

  it("returns nothing for an empty or closed range", () => {
    expect(
      expandSchedule(
        { endDate: "2026-11-01", startDate: "2026-12-01", weekdays: MON_THU },
        "2026-11-01",
        "2026-12-31"
      )
    ).toStrictEqual([]);
    expect(
      expandSchedule(
        { endDate: null, startDate: "2026-11-01", weekdays: [] },
        "2026-11-01",
        "2026-12-31"
      )
    ).toStrictEqual([]);
  });
});

const stored = (patch: Partial<StoredOccurrence>): StoredOccurrence => ({
  date: "2026-11-23",
  durationMinutes: null,
  id: "s1",
  note: null,
  originalDate: null,
  scheduleId: null,
  status: "planned",
  title: null,
  trainingId: "t1",
  ...patch,
});

describe(mergeOccurrences, () => {
  const TODAY = "2026-11-24";

  const virtual = [
    { date: "2026-11-19", scheduleId: "r1", trainingId: "t1" },
    { date: "2026-11-23", scheduleId: "r1", trainingId: "t1" },
    { date: "2026-11-26", scheduleId: "r1", trainingId: "t1" },
  ];

  it("derives missed only for planned days before today", () => {
    expect(deriveStatus("planned", "2026-11-23", TODAY)).toBe("missed");
    expect(deriveStatus("planned", TODAY, TODAY)).toBe("planned");
    expect(deriveStatus("skipped", "2026-11-23", TODAY)).toBe("skipped");
  });

  it("replaces touched occurrences, keeps moved ones on their new day", () => {
    const entries = mergeOccurrences(
      virtual,
      [
        stored({
          date: "2026-11-23",
          id: "done",
          note: "Felt strong",
          originalDate: "2026-11-23",
          scheduleId: "r1",
          status: "done",
        }),
        stored({
          date: "2026-11-27",
          id: "moved",
          originalDate: "2026-11-26",
          scheduleId: "r1",
        }),
        stored({
          date: "2026-11-25",
          id: "free",
          title: "Run",
          trainingId: null,
        }),
      ],
      TODAY
    );

    expect(
      entries.map((entry) => [entry.date, entry.status, entry.key])
    ).toStrictEqual([
      ["2026-11-19", "missed", "r1:2026-11-19"],
      ["2026-11-23", "done", "done"],
      ["2026-11-25", "planned", "free"],
      ["2026-11-27", "planned", "moved"],
    ]);
  });
});
