import { describe, expect, it } from "vitest";

import { groupInvoices } from "./group-invoices";

describe(groupInvoices, () => {
  it("orders groups overdue → sent → draft → paid → void with totals", () => {
    const groups = groupInvoices([
      { amountMinor: 100, currency: "EUR", status: "paid" },
      { amountMinor: 300, currency: "EUR", status: "overdue" },
      { amountMinor: 50, currency: "EUR", status: "paid" },
      { amountMinor: 20, currency: "EUR", status: "draft" },
    ] as const);

    expect(
      groups.map((group) => [group.key, group.total[0]?.amountMinor])
    ).toStrictEqual([
      ["overdue", 300],
      ["draft", 20],
      ["paid", 150],
    ]);
  });
});
