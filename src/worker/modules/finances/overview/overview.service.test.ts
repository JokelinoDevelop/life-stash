import { describe, expect, it } from "vitest";

import type { CategoryWithUsage } from "../categories/categories.service";
import type { TransactionRow } from "../transactions/transactions.repository";
import { CAR_COSTS, OverviewService } from "./overview.service";

const TODAY = "2026-11-27";

const entry = (overrides: Partial<TransactionRow> = {}): TransactionRow => ({
  amountMinor: 100,
  categoryId: "food",
  clientId: null,
  createdAt: "2026-01-01T00:00:00Z",
  currency: "EUR",
  date: "2026-01-10",
  deletedAt: null,
  description: "x",
  householdId: "h1",
  id: crypto.randomUUID(),
  invoiceId: null,
  kind: "expense",
  notes: null,
  recurringId: null,
  updatedAt: "2026-01-01T00:00:00Z",
  ...overrides,
});

// oxlint-disable-next-line sonarjs/shorthand-property-grouping -- conflicts with sort-keys
const category = (id: string, name: string): CategoryWithUsage => ({
  archivedAt: null,
  createdAt: "2026-01-01T00:00:00Z",
  entryCount: 0,
  householdId: "h1",
  icon: null,
  id,
  kind: "expense",
  name,
  position: 0,
  recentCount: 0,
  systemKey: null,
});

const ENTRIES = [
  entry({
    amountMinor: 1000,
    categoryId: "pay",
    clientId: "acme",
    date: "2024-03-01",
    kind: "income",
  }),
  entry({ amountMinor: 400, date: "2024-03-05" }),
  entry({
    amountMinor: 2000,
    categoryId: "pay",
    clientId: "acme",
    date: "2025-06-01",
    kind: "income",
  }),
  entry({
    amountMinor: 3000,
    categoryId: "pay",
    date: "2026-02-01",
    kind: "income",
  }),
  entry({ amountMinor: 500, date: "2026-02-10" }),
  entry({ amountMinor: 700, categoryId: "rent", date: "2026-11-01" }),
];

const service = (entries: TransactionRow[] = ENTRIES) =>
  new OverviewService({
    categories: {
      list: async () =>
        await Promise.resolve([
          category("food", "Food"),
          category("rent", "Rent"),
        ]),
    },
    clock: {
      now: () => new Date(`${TODAY}T10:00:00Z`),
      today: async () => await Promise.resolve(TODAY),
    },
    garage: {
      entries: async () =>
        await Promise.resolve([
          { amountMinor: 250, currency: "EUR" as const, date: "2026-05-01" },
          { amountMinor: 999, currency: "EUR" as const, date: "2023-05-01" },
        ]),
    },
    invoices: {
      waiting: async () =>
        await Promise.resolve({
          receivables: {
            overdue: [],
            overdueCount: 0,
            unpaid: [],
            unpaidCount: 0,
            oldestOverdue: null,
          },
          rows: [],
        }),
    },
    recurring: { pending: async () => await Promise.resolve([]) },
    transactions: {
      inRange: async (from, to) =>
        await Promise.resolve(
          entries.filter((item) => item.date >= from && item.date <= to)
        ),
      recent: async () => await Promise.resolve([]),
    },
  });

const NO_FILTER = { categoryId: null, clientId: null, range: null };

describe(OverviewService, () => {
  it("covers all time by default, from the first entry to today", async () => {
    const overview = await service().get(NO_FILTER);

    expect(overview.allTime).toBeTruthy();
    expect(overview.range).toStrictEqual({ from: "2024-03-01", to: TODAY });
    expect(overview.granularity).toBe("quarter");
    expect(overview.earned).toStrictEqual([
      { amountMinor: 6000, currency: "EUR" },
    ]);
    expect(overview.spent).toStrictEqual([
      { amountMinor: 1600, currency: "EUR" },
    ]);
  });

  it("has no previous period for all time and lists years with entries", async () => {
    const overview = await service().get(NO_FILTER);

    expect(overview.previous).toBeNull();
    expect(overview.years).toStrictEqual([2026, 2025, 2024]);
  });

  it("narrows to a range and compares with the period before", async () => {
    const overview = await service().get({
      ...NO_FILTER,
      range: { from: "2026-01-01", to: "2026-12-31" },
    });

    expect(overview.granularity).toBe("month");
    expect(overview.buckets).toHaveLength(12);
    expect(overview.earned).toStrictEqual([
      { amountMinor: 3000, currency: "EUR" },
    ]);
    expect(overview.previous?.range).toStrictEqual({
      from: "2025-01-01",
      to: "2025-12-31",
    });
    expect(overview.previous?.earned).toStrictEqual([
      { amountMinor: 2000, currency: "EUR" },
    ]);
  });

  it("adds car costs in range as their own category with a trend", async () => {
    const overview = await service().get({
      ...NO_FILTER,
      range: { from: "2026-01-01", to: "2026-12-31" },
    });

    const car = overview.categories.find(
      (share) => share.categoryId === CAR_COSTS
    );

    expect(car?.amountMinor).toBe(250);
    expect(car?.trend[4]).toBe(250);
    expect(overview.categories.map((share) => share.name)).toStrictEqual([
      "Rent",
      "Food",
      "",
    ]);
  });

  it("averages only months that have started", async () => {
    const overview = await service().get({
      ...NO_FILTER,
      range: { from: "2026-01-01", to: "2026-12-31" },
    });

    expect(overview.highlights[0]?.months).toBe(11);
    expect(overview.highlights[0]?.best).toStrictEqual({
      key: "2026-02",
      netMinor: 2500,
    });
  });

  it("filters by client and leaves car costs out", async () => {
    const overview = await service().get({ ...NO_FILTER, clientId: "acme" });

    expect(overview.earned).toStrictEqual([
      { amountMinor: 3000, currency: "EUR" },
    ]);
    expect(overview.spent).toStrictEqual([]);
    expect(overview.categories).toStrictEqual([]);
  });

  it("filters by category", async () => {
    const overview = await service().get({ ...NO_FILTER, categoryId: "food" });

    expect(overview.spent).toStrictEqual([
      { amountMinor: 900, currency: "EUR" },
    ]);
    expect(overview.earned).toStrictEqual([]);
  });
});
