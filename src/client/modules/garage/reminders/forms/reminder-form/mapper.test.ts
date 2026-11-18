import { describe, expect, it } from "vitest";

import {
  packageTarget,
  reminderFormDefaults,
  reminderFormToCreateRequest,
} from "./mapper";

describe("reminder form mapper", () => {
  it("maps targets, distances and intervals", () => {
    const request = reminderFormToCreateRequest(
      {
        ...reminderFormDefaults,
        dueOdometer: "150 000",
        intervalKm: "15000",
        intervalMonths: "12",
        target: packageTarget("p1"),
        title: " Oil service ",
      },
      { carId: "c", unit: "km" }
    );

    expect(request).toStrictEqual({
      carId: "c",
      dueDate: null,
      dueOdometerKm: 150_000,
      intervalKm: 15_000,
      intervalMonths: 12,
      itemId: null,
      kind: "service",
      notes: null,
      packageId: "p1",
      title: "Oil service",
    });
  });

  it("drops package links for non-service reminders and zero intervals", () => {
    const request = reminderFormToCreateRequest(
      {
        ...reminderFormDefaults,
        dueDate: "2027-01-01",
        intervalMonths: "0",
        kind: "insurance",
        target: packageTarget("p1"),
        title: "Insurance",
      },
      { carId: "c", unit: "km" }
    );

    expect(request.packageId).toBeNull();
    expect(request.intervalMonths).toBeNull();
  });
});
