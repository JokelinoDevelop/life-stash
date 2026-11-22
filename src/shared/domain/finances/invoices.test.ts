import { describe, expect, it } from "vitest";

import {
  averageDaysToGetPaid,
  defaultDueDate,
  invoiceStatus,
  formatInvoiceNumber,
  nextInvoiceSeq,
  parseInvoiceNumber,
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

describe(parseInvoiceNumber, () => {
  it("reads YYYY-NNN and YYYY/NNN of the issue year", () => {
    expect(parseInvoiceNumber("2026-012", 2026)).toStrictEqual({
      seq: 12,
      year: 2026,
    });
    expect(parseInvoiceNumber(" 2026/1000 ", 2026)).toStrictEqual({
      seq: 1000,
      year: 2026,
    });
  });

  it("counts a plain number as a sequence of the issue year", () => {
    expect(parseInvoiceNumber("011", 2026)).toStrictEqual({
      seq: 11,
      year: 2026,
    });
  });

  it("refuses other years, zero and other shapes", () => {
    expect(parseInvoiceNumber("2025-004", 2026)).toBeNull();
    expect(parseInvoiceNumber("000", 2026)).toBeNull();
    expect(parseInvoiceNumber("INV-7", 2026)).toBeNull();
    expect(parseInvoiceNumber("", 2026)).toBeNull();
  });
});

describe(formatInvoiceNumber, () => {
  it("pads to three digits in each format", () => {
    expect(formatInvoiceNumber(2026, 12)).toBe("2026-012");
    expect(formatInvoiceNumber(2026, 9, "YYYY/NNN")).toBe("2026/009");
    expect(formatInvoiceNumber(2026, 42, "NNN")).toBe("042");
  });

  it("grows past 999", () => {
    expect(formatInvoiceNumber(2026, 1000)).toBe("2026-1000");
  });
});

describe(nextInvoiceSeq, () => {
  it("continues the highest sequence, with or without gaps", () => {
    expect(nextInvoiceSeq([1, 2, 11, 5])).toBe(12);
    expect(nextInvoiceSeq([])).toBe(1);
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
