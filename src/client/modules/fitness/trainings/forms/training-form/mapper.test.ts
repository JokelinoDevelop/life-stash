import { describe, expect, it } from "vitest";

import { trainingFormToCreateRequest, trainingToFormValues } from "./mapper";

describe(trainingFormToCreateRequest, () => {
  it("parses minutes, trims text and sorts weekdays", () => {
    expect(
      trainingFormToCreateRequest({
        description: "  ",
        durationMinutes: "45",
        name: " Leg day ",
        weekdays: ["4", "1"],
      })
    ).toStrictEqual({
      description: null,
      durationMinutes: 45,
      name: "Leg day",
      weekdays: [1, 4],
    });
  });

  it("round-trips a training", () => {
    expect(
      trainingToFormValues({
        archived: false,
        description: null,
        durationMinutes: null,
        id: "t1",
        name: "Run",
        weekdays: [6],
      })
    ).toStrictEqual({
      description: "",
      durationMinutes: "",
      name: "Run",
      weekdays: ["6"],
    });
  });
});
