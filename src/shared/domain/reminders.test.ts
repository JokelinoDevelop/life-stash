import { describe, expect, it } from "vitest";

import {
  evaluateReminder,
  needsHeadsUp,
  nextRecurrence,
  reminderHorizon,
  reminderProgress,
} from "./reminders";

const today = "2026-11-18";

describe(evaluateReminder, () => {
  it("marks date reminders due soon within a week and overdue after", () => {
    const context = { latestOdometerKm: null, today };
    expect(
      evaluateReminder({ dueDate: "2026-12-30", dueOdometerKm: null }, context)
        .status
    ).toBe("upcoming");
    expect(
      evaluateReminder({ dueDate: "2026-11-25", dueOdometerKm: null }, context)
        .status
    ).toBe("due-soon");
    expect(
      evaluateReminder({ dueDate: "2026-11-18", dueOdometerKm: null }, context)
        .status
    ).toBe("overdue");
  });

  it("uses whichever target comes first", () => {
    const result = evaluateReminder(
      { dueDate: "2027-06-01", dueOdometerKm: 150_000 },
      { latestOdometerKm: 150_200, today }
    );

    expect(result.status).toBe("overdue");
    expect(result.kmLeft).toBe(-200);
  });

  it("ignores odometer targets until a reading exists", () => {
    const target = { dueDate: null, dueOdometerKm: 150_000 };
    expect(needsHeadsUp(target, { latestOdometerKm: null, today })).toBeFalsy();
    expect(
      needsHeadsUp(target, { latestOdometerKm: 149_100, today })
    ).toBeTruthy();
  });
});

describe(nextRecurrence, () => {
  it("schedules from the actual completion date and odometer", () => {
    expect(
      nextRecurrence({
        completedAtKm: 151_000,
        completedOn: "2026-11-18",
        intervalKm: 15_000,
        intervalMonths: 12,
        previous: { dueDate: "2026-11-01", dueOdometerKm: 150_000 },
      })
    ).toStrictEqual({ dueDate: "2027-11-18", dueOdometerKm: 166_000 });
  });

  it("falls back to the previous target when the odometer is unknown", () => {
    expect(
      nextRecurrence({
        completedAtKm: null,
        completedOn: "2026-11-18",
        intervalKm: 15_000,
        intervalMonths: null,
        previous: { dueDate: null, dueOdometerKm: 150_000 },
      })
    ).toStrictEqual({ dueDate: null, dueOdometerKm: 165_000 });
  });

  it("returns null without an interval", () => {
    expect(
      nextRecurrence({
        completedAtKm: 1,
        completedOn: today,
        intervalKm: null,
        intervalMonths: null,
        previous: { dueDate: today, dueOdometerKm: null },
      })
    ).toBeNull();
  });
});

describe(reminderProgress, () => {
  const base = {
    daysLeft: null,
    intervalKm: null,
    intervalMonths: null,
    kmLeft: null,
  };

  it("is full when overdue", () => {
    expect(reminderProgress({ ...base, status: "overdue" })).toBe(1);
  });

  it("uses the share of the km interval already driven", () => {
    expect(
      reminderProgress({
        ...base,
        intervalKm: 15_000,
        kmLeft: 1500,
        status: "due-soon",
      })
    ).toBeCloseTo(0.9);
  });

  it("takes whichever interval is further along", () => {
    expect(
      reminderProgress({
        daysLeft: 365,
        intervalKm: 10_000,
        intervalMonths: 24,
        kmLeft: 8000,
        status: "upcoming",
      })
    ).toBeCloseTo(0.5, 1);
  });

  it("clamps to 0–1 and falls back by status without an interval", () => {
    expect(
      reminderProgress({
        ...base,
        intervalKm: 1000,
        kmLeft: 5000,
        status: "upcoming",
      })
    ).toBe(0);
    expect(reminderProgress({ ...base, status: "upcoming" })).toBe(0.25);
    expect(reminderProgress({ ...base, status: "due-soon" })).toBeCloseTo(0.9);
  });
});

describe(reminderHorizon, () => {
  it("groups by overdue, the next 30 days and later", () => {
    expect(
      reminderHorizon({ daysLeft: -2, kmLeft: null, status: "overdue" })
    ).toBe("overdue");
    expect(
      reminderHorizon({ daysLeft: 25, kmLeft: null, status: "upcoming" })
    ).toBe("next30");
    expect(
      reminderHorizon({ daysLeft: null, kmLeft: 600, status: "due-soon" })
    ).toBe("next30");
    expect(
      reminderHorizon({ daysLeft: 200, kmLeft: 9000, status: "upcoming" })
    ).toBe("later");
  });
});
