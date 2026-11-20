import { describe, expect, it } from "vitest";

import type { InvoiceDetail } from "../../invoices.queries";
import {
  duplicateToFormValues,
  invoiceFormToCreateRequest,
  periodBounds,
} from "./mapper";

const DETAIL: InvoiceDetail = {
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
  issuedAt: "2026-09-30T10:00:00Z",
  itemised: true,
  lines: [
    {
      amountMinor: 480_000,
      description: "Development",
      id: "l1",
      quantityMilli: 120_000,
      unit: "hrs",
      unitPriceMinor: 4000,
      vatMinor: 0,
      vatRateBp: 0,
    },
  ],
  number: "2026-012",
  paidAt: "2026-10-28",
  periodEnd: "2026-09-30",
  periodStart: "2026-09-01",
  projectId: null,
  projectName: null,
  sentAt: "2026-09-30",
  status: "paid",
  transaction: null,
  voidedAt: null,
};

describe(duplicateToFormValues, () => {
  it("moves period, issue and due date one month on, as a draft without a number", () => {
    const values = duplicateToFormValues(DETAIL);

    expect([
      values.period,
      values.issueDate,
      values.dueDate,
      values.number,
    ]).toStrictEqual(["2026-10", "2026-10-31", "2026-11-30", ""]);
  });
});

describe(invoiceFormToCreateRequest, () => {
  it("turns the period into its first and last day and a recorded amount into minor units", () => {
    const body = invoiceFormToCreateRequest(
      {
        ...duplicateToFormValues(DETAIL),
        amount: "4,800.50".replace(",", ""),
        mode: "recorded",
        number: " 011 ",
        period: "2026-02",
      },
      true
    );

    expect([
      body.periodStart,
      body.periodEnd,
      body.amountMinor,
      body.issue,
      body.number,
    ]).toStrictEqual(["2026-02-01", "2026-02-28", 480_050, true, "011"]);
    expect(periodBounds("none")).toBeNull();
    expect(body.lines).toStrictEqual([]);
  });

  it("sends itemised lines in thousandths, minor units and basis points", () => {
    const body = invoiceFormToCreateRequest(
      {
        ...duplicateToFormValues(DETAIL),
        lines: [
          {
            description: " Development ",
            key: "a",
            quantity: "1,5",
            unit: "hrs",
            unitPrice: "40.25",
            vatRate: "5,5",
          },
          {
            description: "Hosting",
            key: "b",
            quantity: "1",
            unit: "",
            unitPrice: "25",
            vatRate: "",
          },
        ],
      },
      false
    );

    expect(body.lines).toStrictEqual([
      {
        description: "Development",
        quantityMilli: 1500,
        unit: "hrs",
        unitPriceMinor: 4025,
        vatRateBp: 550,
      },
      {
        description: "Hosting",
        quantityMilli: 1000,
        unit: null,
        unitPriceMinor: 2500,
        vatRateBp: 0,
      },
    ]);
  });
});

describe(duplicateToFormValues, () => {
  it("keeps the lines and their units for the copy", () => {
    expect(duplicateToFormValues(DETAIL).lines).toMatchObject([
      { description: "Development", quantity: "120", unit: "hrs" },
    ]);
  });
});

describe("drafts", () => {
  it("send no number until issued", () => {
    const values = { ...duplicateToFormValues(DETAIL), number: "2026-099" };

    expect(invoiceFormToCreateRequest(values, false).number).toBeNull();
    expect(
      invoiceFormToCreateRequest({ ...values, number: "" }, true).number
    ).toBeNull();
  });
});
