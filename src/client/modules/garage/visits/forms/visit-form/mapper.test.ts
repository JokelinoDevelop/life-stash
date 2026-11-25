import { describe, expect, it } from "vitest";

import { visitFormDefaults, visitFormToCreateRequest } from "./mapper";

describe("visit form mapper", () => {
  it("converts form strings to the API request", () => {
    const values = {
      ...visitFormDefaults(
        { currency: "MKD", today: "2026-11-18", unit: "mi" },
        ["Engine oil"]
      ),
      date: { date: "", month: "3", precision: "month" as const, year: "2019" },
      odometer: "100 000",
      total: "2500,50",
    };

    values.items.push({
      cost: "300",
      key: "k",
      label: " Wiper fluid ",
    });

    const request = visitFormToCreateRequest(values, {
      carId: "c",
      reminderId: null,
      unit: "mi",
    });

    expect(request.date).toBe("2019-03-01");
    expect(request.datePrecision).toBe("month");
    expect(request.odometerKm).toBe(160_934);
    expect(request.totalMinor).toBe(250_050);
    expect(request.items).toStrictEqual([
      { costMinor: null, label: "Engine oil" },
      { costMinor: 30_000, label: "Wiper fluid" },
    ]);
  });

  it("starts a new visit with one empty line", () => {
    const values = visitFormDefaults({
      currency: "MKD",
      today: "2026-11-18",
      unit: "km",
    });

    expect(values.items.map((item) => item.label)).toStrictEqual([""]);
  });
});
