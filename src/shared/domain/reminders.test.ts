import { describe, expect, it } from "vitest";

import { evaluateReminder, needsHeadsUp, nextRecurrence } from "./reminders";

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
