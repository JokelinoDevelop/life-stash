import { describe, expect, it } from "vitest";

import {
  duplicateToFormValues,
  invoiceFormToCreateRequest,
  periodBounds,
} from "./mapper";

const DETAIL = {
  amountMinor: 480_000,
  attachments: 1,
  clientId: "c1",
  clientName: "Northwind Labs",
  createdAt: "2026-09-29T10:00:00Z",
  currency: "EUR",
  daysOverdue: 0,
  description: "Software development",
  dueDate: "2026-10-30",
  firstAttachedAt: null,
  id: "i1",
  issueDate: "2026-09-30",
  notes: null,
  number: "2026-012",
  paidAt: "2026-10-28",
  periodEnd: "2026-09-30",
  periodStart: "2026-09-01",
  sentAt: "2026-09-30",
  status: "paid",
  transaction: null,
} as const;

describe(duplicateToFormValues, () => {
  it("moves period, issue and due date one month on with the new number", () => {
    const values = duplicateToFormValues(DETAIL, "2026-015");

    expect([
      values.period,
      values.issueDate,
      values.dueDate,
      values.number,
    ]).toStrictEqual(["2026-10", "2026-10-30", "2026-11-30", "2026-015"]);
  });
});

describe(invoiceFormToCreateRequest, () => {
  it("turns the period into its first and last day and the amount into minor units", () => {
    const body = invoiceFormToCreateRequest(
      {
        ...duplicateToFormValues(DETAIL, "2026-015"),
        amount: "4,800.50".replace(",", ""),
        period: "2026-02",
      },
      true
    );

    expect([
      body.periodStart,
      body.periodEnd,
      body.amountMinor,
      body.markSent,
    ]).toStrictEqual(["2026-02-01", "2026-02-28", 480_050, true]);
    expect(periodBounds("none")).toBeNull();
  });
});
