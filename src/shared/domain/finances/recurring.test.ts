import { describe, expect, it } from "vitest";

import { confirmDate, pendingRecurring, recurringDate } from "./recurring";
import { invoicesToRemind } from "./reminders";

describe(recurringDate, () => {
  it("uses the day of month, clamped to short months", () => {
    expect(recurringDate(25, "2026-11")).toBe("2026-11-25");
    expect(recurringDate(31, "2026-02")).toBe("2026-02-28");
    expect(recurringDate(31, "2028-02")).toBe("2028-02-29");
  });
});

describe(pendingRecurring, () => {
  it("asks once a month for active templates, ordered by date", () => {
    const pending = pendingRecurring(
      [
        {
          active: true,
          dayOfMonth: 25,
          id: "salary",
          lastHandledMonth: "2026-10",
        },
        { active: true, dayOfMonth: 5, id: "rent-in", lastHandledMonth: null },
        {
          active: true,
          dayOfMonth: 1,
          id: "done",
          lastHandledMonth: "2026-11",
        },
        { active: false, dayOfMonth: 1, id: "off", lastHandledMonth: null },
      ],
      "2026-11-19"
    );

    expect(pending.map((item) => [item.id, item.dueDate])).toStrictEqual([
      ["rent-in", "2026-11-05"],
      ["salary", "2026-11-25"],
    ]);
  });

  it("books on the due date, or today when that is still ahead", () => {
    expect(confirmDate("2026-11-25", "2026-11-19")).toBe("2026-11-19");
    expect(confirmDate("2026-11-05", "2026-11-19")).toBe("2026-11-05");
  });
});

describe(invoicesToRemind, () => {
  it("picks sent invoices past due that weren't notified", () => {
    const due = invoicesToRemind(
      [
        {
          dueDate: "2026-11-05",
          id: "late",
          overdueNotifiedAt: null,
          status: "sent",
        },
        {
          dueDate: "2026-11-19",
          id: "today",
          overdueNotifiedAt: null,
          status: "sent",
        },
        {
          dueDate: "2026-11-01",
          id: "told",
          overdueNotifiedAt: "2026-11-02T08:00:00Z",
          status: "sent",
        },
        {
          dueDate: "2026-11-01",
          id: "paid",
          overdueNotifiedAt: null,
          status: "paid",
        },
      ],
      "2026-11-19"
    );

    expect(due.map((invoice) => invoice.id)).toStrictEqual(["late"]);
  });
});
