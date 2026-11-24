import { describe, expect, it } from "vitest";

import {
  sessionFormDefaults,
  sessionFormToCreateRequest,
  sessionFormToOccurrenceRequest,
  sessionFormToUpdateRequest,
} from "./mapper";
import { OTHER_TRAINING } from "./schema";

const VALUES = {
  date: "2026-11-26",
  durationMinutes: "50",
  note: " Squats 5x5 ",
  status: "done" as const,
  title: "",
  trainingId: "t1",
};

describe(sessionFormDefaults, () => {
  it("plans future sessions and logs today's", () => {
    expect(
      sessionFormDefaults({
        date: "2026-11-30",
        today: "2026-11-24",
        trainingId: "",
      }).status
    ).toBe("planned");
    expect(
      sessionFormDefaults({
        date: "2026-11-24",
        today: "2026-11-24",
        trainingId: "t1",
      })
    ).toMatchObject({ status: "done", trainingId: "t1" });
  });
});

describe(sessionFormToCreateRequest, () => {
  it("sends the training or a free-form title", () => {
    expect(sessionFormToCreateRequest(VALUES)).toStrictEqual({
      date: "2026-11-26",
      durationMinutes: 50,
      note: "Squats 5x5",
      status: "done",
      title: null,
      trainingId: "t1",
    });
    expect(
      sessionFormToCreateRequest({
        ...VALUES,
        title: " Run ",
        trainingId: OTHER_TRAINING,
      })
    ).toMatchObject({ title: "Run", trainingId: null });
  });

  it("leaves the training out for weekly occurrences", () => {
    expect(sessionFormToUpdateRequest(VALUES, true)).not.toHaveProperty(
      "trainingId"
    );
    expect(
      sessionFormToOccurrenceRequest(VALUES, {
        originalDate: "2026-11-23",
        scheduleId: "r1",
      })
    ).toMatchObject({ date: "2026-11-26", originalDate: "2026-11-23" });
  });
});
