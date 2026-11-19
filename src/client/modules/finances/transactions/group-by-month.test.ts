import { describe, expect, it } from "vitest";

import { groupByMonth, netByCurrency } from "./group-by-month";

describe(groupByMonth, () => {
  it("groups consecutive rows by month and attaches the month totals", () => {
    const summary = { entries: 9, expense: [], income: [], month: "2026-11" };

    const groups = groupByMonth(
      [{ date: "2026-11-19" }, { date: "2026-11-02" }, { date: "2026-10-31" }],
      [summary]
    );

    expect(
      groups.map((group) => [group.month, group.rows.length])
    ).toStrictEqual([
      ["2026-11", 2],
      ["2026-10", 1],
    ]);
    expect(groups[0]?.summary).toBe(summary);
  });
});

describe(netByCurrency, () => {
  it("subtracts spending from income per currency", () => {
    expect(
      netByCurrency({
        entries: 3,
        expense: [
          { amountMinor: 500, currency: "MKD" },
          { amountMinor: 200, currency: "EUR" },
        ],
        income: [{ amountMinor: 1000, currency: "EUR" }],
        month: "2026-11",
      })
    ).toStrictEqual([
      { amountMinor: 800, currency: "EUR" },
      { amountMinor: -500, currency: "MKD" },
    ]);
  });
});
