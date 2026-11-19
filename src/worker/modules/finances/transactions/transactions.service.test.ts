import { describe, expect, it } from "vitest";

import type { CategoryRow } from "../categories/categories.repository";
import type {
  TransactionListRow,
  TransactionRow,
  TransactionsRepositoryPort,
} from "./transactions.repository";
import { TransactionsService } from "./transactions.service";

const NOW = new Date("2026-11-19T10:00:00Z");

const row = (overrides: Partial<TransactionRow> = {}): TransactionListRow => ({
  amountMinor: 100,
  category: { icon: null, id: "c1", name: "Rent", systemKey: null },
  categoryId: "c1",
  client: null,
  clientId: null,
  createdAt: "2026-11-01T00:00:00Z",
  currency: "EUR",
  date: "2026-11-01",
  deletedAt: null,
  description: "x",
  householdId: "h1",
  id: crypto.randomUUID(),
  invoice: null,
  invoiceId: null,
  kind: "expense",
  notes: null,
  recurringId: null,
  updatedAt: "2026-11-01T00:00:00Z",
  ...overrides,
});

interface FakeTransactions extends TransactionsRepositoryPort {
  all: () => TransactionListRow[];
}

const fakeTransactions = (
  initial: TransactionListRow[] = []
): FakeTransactions => {
  let rows = initial;
  const live = () => rows.filter((item) => item.deletedAt === null);

  const update: TransactionsRepositoryPort["update"] = async (id, patch) => {
    rows = rows.map((item) => (item.id === id ? { ...item, ...patch } : item));
    await Promise.resolve();
  };

  return {
    all: () => rows,
    recent: async (limit) => await Promise.resolve(live().slice(0, limit)),
    deletedBefore: async (cutoff) =>
      await Promise.resolve(
        rows
          .filter((item) => item.deletedAt !== null && item.deletedAt < cutoff)
          .map((item) => item.id)
      ),
    findById: async (id, options) =>
      await Promise.resolve(
        (options?.includeDeleted === true ? rows : live()).find(
          (item) => item.id === id
        )
      ),
    inRange: async () => await Promise.resolve(live()),
    insert: async (values) => {
      const created = row({
        ...values,
        clientId: values.clientId ?? null,
        invoiceId: values.invoiceId ?? null,
        notes: values.notes ?? null,
        recurringId: values.recurringId ?? null,
      });

      rows.push(created);

      return await Promise.resolve(created);
    },
    monthTotals: async () =>
      await Promise.resolve([
        {
          amountMinor: 0,
          currency: "EUR" as const,
          entries: live().length,
          kind: "expense" as const,
          month: "2026-11",
        },
      ]),
    page: async (_filter, _cursor, limit) =>
      await Promise.resolve(live().slice(0, limit)),
    purge: async (ids) => {
      rows = rows.filter((item) => !ids.includes(item.id));
      await Promise.resolve();
    },
    setDeleted: async (id, deletedAt) => {
      rows = rows.map((item) =>
        item.id === id ? { ...item, deletedAt } : item
      );
      await Promise.resolve();
    },
    update,
  };
};

const CATEGORY: CategoryRow = {
  archivedAt: null,
  createdAt: NOW.toISOString(),
  householdId: "h1",
  icon: null,
  id: "c1",
  kind: "expense",
  name: "Rent",
  position: 0,
  systemKey: null,
};

const clients = {
  requireForEntry: async () =>
    await Promise.reject(new Error("no clients in this test")),
};

const attachments = {
  countByOwner: async () => await Promise.resolve(new Map<string, number>()),
};

const makeService = (
  repo: TransactionsRepositoryPort,
  cats: ReturnType<typeof categories>,
  now: () => Date = () => NOW
) =>
  // oxlint-disable-next-line sonarjs/shorthand-property-grouping -- conflicts with sort-keys
  new TransactionsService({
    attachments,
    categories: cats,
    clients,
    now,
    repo,
  });

const categories = () => {
  const calls: (string | null)[][] = [];

  return {
    calls,
    requireForEntry: async (
      categoryId: string,
      kind: string,
      keptFrom: string | null = null
    ) => {
      calls.push(
        keptFrom === null ? [categoryId, kind] : [categoryId, kind, keptFrom]
      );

      return await Promise.resolve(CATEGORY);
    },
  };
};

const FILTER = {
  categoryId: null,
  clientId: null,
  from: null,
  kind: null,
  q: null,
  to: null,
};

const INPUT = {
  amountMinor: 500,
  categoryId: "c1",
  clientId: null,
  currency: "EUR",
  date: "2026-11-19",
  description: "Tinex",
  kind: "expense",
  notes: null,
} as const;

describe(TransactionsService, () => {
  it("returns a cursor only when another page follows", async () => {
    const repo = fakeTransactions([
      row({ date: "2026-11-03" }),
      row({ date: "2026-11-02" }),
      row({ date: "2026-11-01" }),
    ]);

    const service = makeService(repo, categories(), () => NOW);

    const page = await service.list(FILTER, null, 2);
    const all = await service.list(FILTER, null, 3);

    expect(page.rows).toHaveLength(2);
    expect(page.nextCursor?.date).toBe("2026-11-02");
    expect(page.total).toBe(3);
    expect(all.nextCursor).toBeNull();
  });

  it("checks the category on create and when kind or category change", async () => {
    const cats = categories();

    const service = makeService(fakeTransactions(), cats, () => NOW);

    const created = await service.create(INPUT);
    await service.update(created.id, { description: "Vero" });

    expect(cats.calls).toStrictEqual([["c1", "expense"]]);

    await service.update(created.id, { categoryId: "c2" });

    expect(cats.calls[1]).toStrictEqual(["c2", "expense", "c1"]);
  });

  it("soft deletes and restores", async () => {
    const target = row();
    const repo = fakeTransactions([target]);
    const service = makeService(repo, categories(), () => NOW);

    await service.delete(target.id);

    await expect(repo.findById(target.id)).resolves.toBeUndefined();

    await service.restore(target.id);

    await expect(repo.findById(target.id)).resolves.toBeDefined();
  });

  it("purges deleted rows once the undo window has passed", async () => {
    const target = row();
    const repo = fakeTransactions([target]);
    let now = NOW;
    const service = makeService(repo, categories(), () => now);
    await service.delete(target.id);

    await expect(service.purgeExpired()).resolves.toStrictEqual([]);

    now = new Date("2026-11-27T10:00:00Z");

    await expect(service.purgeExpired()).resolves.toStrictEqual([target.id]);
    expect(repo.all()).toHaveLength(0);
  });
});
