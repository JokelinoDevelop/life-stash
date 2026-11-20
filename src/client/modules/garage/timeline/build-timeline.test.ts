import { describe, expect, it } from "vitest";

import { buildTimeline } from "./build-timeline";

const input = {
  expenses: [{ date: "2026-05-01", id: "e1" }],
  readings: [
    { date: "2026-06-01", id: "r1", source: "reading" },
    { date: "2026-05-01", id: "r2", source: "service" },
  ],
  visits: [
    { date: "2026-05-01", id: "v1" },
    { date: "2025-12-24", id: "v2" },
  ],
};

describe(buildTimeline, () => {
  it("merges everything newest first, services before expenses on the same day", () => {
    expect(buildTimeline(input, "all").map((entry) => entry.id)).toStrictEqual([
      "r1",
      "v1",
      "e1",
      "v2",
    ]);
  });

  it("leaves out readings that belong to a service or expense", () => {
    expect(
      buildTimeline(input, "odometer").map((entry) => entry.id)
    ).toStrictEqual(["r1"]);
  });

  it("filters to one kind", () => {
    expect(
      buildTimeline(input, "services").map((entry) => entry.id)
    ).toStrictEqual(["v1", "v2"]);
  });
});
