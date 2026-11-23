import { describe, expect, it } from "vitest";

import {
  groupTodayItems,
  invoiceHorizon,
  summarizeToday,
} from "./today-groups";

const TODAY = "2026-11-19";

const NO_INVOICES: { dueDate: string; id: string; status: string }[] = [];

const reminder = (
  id: string,
  status: "overdue" | "due-soon" | "upcoming",
  daysLeft: number | null
) => ({ daysLeft, id, status, kmLeft: null });

describe(invoiceHorizon, () => {
  it("puts overdue and past-due invoices in overdue", () => {
    expect(
      invoiceHorizon(
        { dueDate: "2026-12-30", id: "a", status: "overdue" },
        TODAY
      )
    ).toBe("overdue");
    expect(
      invoiceHorizon({ dueDate: "2026-11-18", id: "a", status: "sent" }, TODAY)
    ).toBe("overdue");
  });

  it("splits sent invoices at 30 days", () => {
    expect(
      invoiceHorizon({ dueDate: "2026-12-19", id: "a", status: "sent" }, TODAY)
    ).toBe("next30");
    expect(
      invoiceHorizon({ dueDate: "2026-12-20", id: "a", status: "sent" }, TODAY)
    ).toBe("later");
  });
});

describe(groupTodayItems, () => {
  it("mixes reminders and invoices sorted by days left", () => {
    const groups = groupTodayItems(
      [reminder("r1", "due-soon", 6), reminder("r2", "upcoming", 25)],
      [{ dueDate: "2026-11-30", id: "i1", status: "sent" }],
      TODAY
    );

    expect(
      groups
        .get("next30")
        ?.map((item) =>
          item.kind === "reminder" ? item.reminder.id : item.invoice.id
        )
    ).toStrictEqual(["r1", "i1", "r2"]);
  });

  it("keeps odometer-only reminders after dated ones, in their given order", () => {
    const groups = groupTodayItems(
      [
        reminder("km1", "overdue", null),
        reminder("km2", "overdue", null),
        reminder("d1", "overdue", -3),
      ],
      NO_INVOICES,
      TODAY
    );

    expect(
      groups
        .get("overdue")
        ?.map((item) =>
          item.kind === "reminder" ? item.reminder.id : item.invoice.id
        )
    ).toStrictEqual(["d1", "km1", "km2"]);
  });
});

describe(summarizeToday, () => {
  it("counts overdue and due-soon items and sums money waiting per currency", () => {
    const summary = summarizeToday(
      [
        reminder("r1", "overdue", -3),
        reminder("r2", "due-soon", 5),
        reminder("r3", "upcoming", 90),
      ],
      [
        {
          amountMinor: 320_000,
          currency: "EUR",
          dueDate: "2026-11-01",
          id: "i1",
          status: "overdue",
        },
        {
          amountMinor: 138_350,
          currency: "EUR",
          dueDate: "2026-11-22",
          id: "i2",
          status: "sent",
        },
        {
          amountMinor: 500_000,
          currency: "MKD",
          dueDate: "2027-02-01",
          id: "i3",
          status: "sent",
        },
      ],
      TODAY
    );

    expect(summary).toStrictEqual({
      dueSoon: 2,
      overdue: 2,
      waiting: [
        { amountMinor: 500_000, currency: "MKD" },
        { amountMinor: 458_350, currency: "EUR" },
      ],
    });
  });

  it("is all zero with nothing to do", () => {
    expect(summarizeToday([], [], TODAY)).toStrictEqual({
      dueSoon: 0,
      overdue: 0,
      waiting: [],
    });
  });
});
