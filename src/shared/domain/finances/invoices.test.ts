import { describe, expect, it } from "vitest";

import {
  averageDaysToGetPaid,
  defaultDueDate,
  invoiceStatus,
  nextInvoiceNumber,
  previousInvoiceNumber,
  receivables,
} from "./invoices";

const TODAY = "2026-11-19";

describe(invoiceStatus, () => {
  it("derives overdue for sent invoices past their due date", () => {
    expect(
      invoiceStatus({ dueDate: "2026-11-05", status: "sent" }, TODAY)
    ).toStrictEqual({
      daysOverdue: 14,
      status: "overdue",
    });
  });

  it("keeps sent invoices due today or later, and other statuses, as they are", () => {
    expect(
      invoiceStatus({ dueDate: TODAY, status: "sent" }, TODAY).status
    ).toBe("sent");
    expect(
      invoiceStatus({ dueDate: "2026-01-01", status: "paid" }, TODAY).status
    ).toBe("paid");
    expect(
      invoiceStatus({ dueDate: "2026-01-01", status: "draft" }, TODAY).status
    ).toBe("draft");
  });
});

describe(nextInvoiceNumber, () => {
  it("continues the highest number of the same year", () => {
    expect(
      nextInvoiceNumber(["2026-013", "2026-014", "2025-021", "custom"], 2026)
    ).toBe("2026-015");
  });

  it("starts each year at 001 and supports other formats", () => {
    expect(nextInvoiceNumber(["2025-021"], 2026)).toBe("2026-001");
    expect(nextInvoiceNumber(["2026/009"], 2026, "YYYY/NNN")).toBe("2026/010");
    expect(nextInvoiceNumber(["041", "2026-003"], 2026, "NNN")).toBe("042");
  });

  it("finds the number it continues from", () => {
    expect(previousInvoiceNumber(["2026-013", "2026-014"], 2026)).toBe(
      "2026-014"
    );
    expect(previousInvoiceNumber([], 2026)).toBeNull();
  });
});

describe(defaultDueDate, () => {
  it("adds the payment terms to the issue date", () => {
    expect(defaultDueDate("2026-11-30", 30)).toBe("2026-12-30");
    expect(defaultDueDate("2026-11-30")).toBe("2026-12-30");
  });
});

describe(averageDaysToGetPaid, () => {
  it("averages over paid invoices only", () => {
    expect(
      averageDaysToGetPaid([
        { issueDate: "2026-09-30", paidAt: "2026-10-28" },
        { issueDate: "2026-09-15", paidAt: "2026-10-12" },
        { issueDate: "2026-11-01", paidAt: null },
      ])
    ).toBe(28);
    expect(averageDaysToGetPaid([])).toBeNull();
  });
});

describe(receivables, () => {
  it("totals unpaid and overdue per currency and finds the oldest overdue", () => {
    const result = receivables(
      [
        {
          amountMinor: 320_000,
          currency: "EUR",
          dueDate: "2026-11-05",
          id: "a",
          status: "sent",
        },
        {
          amountMinor: 480_000,
          currency: "EUR",
          dueDate: "2026-11-30",
          id: "b",
          status: "sent",
        },
        {
          amountMinor: 100,
          currency: "EUR",
          dueDate: "2026-01-01",
          id: "c",
          status: "paid",
        },
        {
          amountMinor: 999,
          currency: "EUR",
          dueDate: "2026-01-01",
          id: "d",
          status: "draft",
        },
      ],
      TODAY
    );

    expect(result.unpaid).toStrictEqual([
      { amountMinor: 800_000, currency: "EUR" },
    ]);
    expect(result.overdue).toStrictEqual([
      { amountMinor: 320_000, currency: "EUR" },
    ]);
    expect([result.unpaidCount, result.overdueCount]).toStrictEqual([2, 1]);
    expect(result.oldestOverdue).toStrictEqual({
      daysOverdue: 14,
      dueDate: "2026-11-05",
      id: "a",
    });
  });
});
