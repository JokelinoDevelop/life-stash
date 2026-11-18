import { describe, expect, it } from "vitest";

import { lastDonePerItem } from "./item-history";

const base = {
  byPreviousOwner: false,
  datePrecision: "day" as const,
  odometerKm: null,
};

describe(lastDonePerItem, () => {
  it("keeps the latest entry per item and counts occurrences", () => {
    const result = lastDonePerItem([
      {
        ...base,
        date: "2024-01-10",
        itemId: "oil",
        label: "Engine oil",
        visitId: "a",
      },
      {
        ...base,
        date: "2025-03-01",
        itemId: "oil",
        label: "Engine oil",
        visitId: "b",
      },
      {
        ...base,
        byPreviousOwner: true,
        date: "2020-01-01",
        itemId: "belt",
        label: "Timing belt",
        visitId: "c",
      },
    ]);

    expect(
      result.map((entry) => [entry.itemId, entry.visitId, entry.timesDone])
    ).toStrictEqual([
      ["oil", "b", 2],
      ["belt", "c", 1],
    ]);
  });

  it("breaks same-day ties by odometer", () => {
    const result = lastDonePerItem([
      {
        ...base,
        date: "2025-03-01",
        itemId: "oil",
        label: "Oil",
        odometerKm: 1000,
        visitId: "a",
      },
      {
        ...base,
        date: "2025-03-01",
        itemId: "oil",
        label: "Oil",
        odometerKm: 2000,
        visitId: "b",
      },
    ]);

    expect(result[0]?.visitId).toBe("b");
  });
});
