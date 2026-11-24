import { describe, expect, it } from "vitest";

import { streakWeeks, weekProgress } from "./progress";
import type { ProgressEntry } from "./progress";

// Tuesday; the week runs 23–29 Nov.
const TODAY = "2026-11-24";

const entry = (date: string, status: ProgressEntry["status"]) => ({
  date,
  status,
});

describe(weekProgress, () => {
  it("counts done out of this week's plan, excusing skipped", () => {
    expect(
      weekProgress(
        [
          entry("2026-11-16", "done"),
          entry("2026-11-23", "done"),
          entry("2026-11-24", "planned"),
          entry("2026-11-26", "planned"),
          entry("2026-11-27", "skipped"),
          entry("2026-11-29", "done"),
        ],
        TODAY
      )
    ).toStrictEqual({ done: 2, scheduled: 4 });
  });
});

describe(streakWeeks, () => {
  it("counts weeks in a row with a done session and nothing missed", () => {
    const entries = [
      entry("2026-11-02", "done"),
      entry("2026-11-09", "done"),
      entry("2026-11-12", "skipped"),
      entry("2026-11-16", "done"),
      entry("2026-11-23", "done"),
    ];

    expect(streakWeeks(entries, TODAY)).toBe(4);
  });

  it("doesn't break on an open current week, and stops at a missed week", () => {
    const entries = [
      entry("2026-11-02", "done"),
      entry("2026-11-09", "missed"),
      entry("2026-11-10", "done"),
      entry("2026-11-16", "done"),
      entry("2026-11-26", "planned"),
    ];

    expect(streakWeeks(entries, TODAY)).toBe(1);
  });

  it("is zero when this week already has a missed session", () => {
    expect(
      streakWeeks(
        [entry("2026-11-16", "done"), entry("2026-11-23", "missed")],
        TODAY
      )
    ).toBe(0);
  });

  it("breaks on a week with nothing done", () => {
    expect(
      streakWeeks(
        [entry("2026-11-02", "done"), entry("2026-11-16", "done")],
        TODAY
      )
    ).toBe(1);
  });
});
