import { describe, expect, it } from "vitest";

import { ApiError } from "../../../core/errors";
import type {
  CategoriesRepositoryPort,
  CategoryRow,
} from "./categories.repository";
import { CategoriesService } from "./categories.service";

const NOW = new Date("2026-11-19T10:00:00Z");

interface FakeCategories extends CategoriesRepositoryPort {
  rows: () => CategoryRow[];
  setEntries: (categoryId: string, entries: number) => void;
}

/** In-memory stand-in for the repository. */
const fakeCategories = (): FakeCategories => {
  let rows: CategoryRow[] = [];
  const entries = new Map<string, number>();

  const updateRow: CategoriesRepositoryPort["update"] = async (id, patch) => {
    rows = rows.map((row) => (row.id === id ? { ...row, ...patch } : row));
    await Promise.resolve();
  };

  return {
    delete: async (id) => {
      rows = rows.filter((row) => row.id !== id);
      await Promise.resolve();
    },
    find: async (id) =>
      await Promise.resolve(rows.find((row) => row.id === id)),
    findBySystemKey: async (key) =>
      await Promise.resolve(rows.find((row) => row.systemKey === key)),
    insert: async (row) => {
      const created = {
        archivedAt: null,
        createdAt: NOW.toISOString(),
        householdId: "h1",
        icon: row.icon ?? null,
        id: crypto.randomUUID(),
        kind: row.kind,
        name: row.name,
        position: row.position ?? 0,
        systemKey: row.systemKey ?? null,
      };

      rows.push(created);

      return await Promise.resolve(created);
    },
    insertMany: async (input) => {
      const created = input.map((row) => ({
        archivedAt: null,
        createdAt: NOW.toISOString(),
        householdId: "h1",
        icon: row.icon ?? null,
        id: crypto.randomUUID(),
        kind: row.kind,
        name: row.name,
        position: row.position ?? 0,
        systemKey: row.systemKey ?? null,
      }));

      rows.push(...created);
      await Promise.resolve();
    },
    list: async () =>
      await Promise.resolve(rows.toSorted((a, b) => a.position - b.position)),
    maxPosition: async (kind) =>
      await Promise.resolve(
        Math.max(
          -1,
          ...rows.filter((row) => row.kind === kind).map((row) => row.position)
        )
      ),
    recentUsage: async () => await Promise.resolve(new Map<string, number>()),
    rows: () => rows,
    setEntries: (categoryId, count) => {
      entries.set(categoryId, count);
    },
    setPositions: async (ids) => {
      await Promise.all(
        ids.map(async (id, position) => {
          await updateRow(id, { position });
        })
      );
    },
    update: updateRow,
    usage: async () => await Promise.resolve(entries),
  };
};

const household = (language: "en" | "mk" = "en") => ({
  preferences: async () =>
    await Promise.resolve({
      currency: "EUR" as const,
      locale: language,
      timeZone: "Europe/Skopje",
    }),
});

const codeOf = async (promise: Promise<unknown>): Promise<string> => {
  try {
    await promise;
  } catch (error) {
    return error instanceof ApiError ? error.code : "unknown";
  }

  return "resolved";
};

const setup = async (locale: "en" | "mk" = "en") => {
  const repo = fakeCategories();
  const service = new CategoriesService(repo, household(locale), () => NOW);
  const rows = await service.list();

  const idOf = (name: string) =>
    rows.find((row) => row.name === name)?.id ?? "";

  return { idOf, repo, rows, service };
};

describe(CategoriesService, () => {
  it("seeds defaults once, in the household's language", async () => {
    const { rows, service } = await setup("mk");
    const again = await service.list();

    expect(again).toHaveLength(rows.length);
    expect(rows.find((row) => row.systemKey === "invoices")?.name).toBe(
      "Фактури"
    );
    expect(
      rows.filter((row) => row.kind === "expense").map((row) => row.position)
    ).toStrictEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it("protects the system category", async () => {
    const { rows, service } = await setup();

    const invoicesId =
      rows.find((row) => row.systemKey === "invoices")?.id ?? "";

    await expect(
      codeOf(service.update(invoicesId, { archived: true }))
    ).resolves.toBe("finances.category_system");
    await expect(codeOf(service.delete(invoicesId))).resolves.toBe(
      "finances.category_system"
    );
  });

  it("archives a category in use instead of deleting it", async () => {
    const { idOf, repo, service } = await setup();
    repo.setEntries(idOf("Rent"), 3);

    await expect(codeOf(service.delete(idOf("Rent")))).resolves.toBe(
      "finances.category_in_use"
    );

    await service.update(idOf("Rent"), { archived: true });
    const rent = await repo.find(idOf("Rent"));

    expect(rent?.archivedAt).toBe(NOW.toISOString());
  });

  it("moves a category within its kind", async () => {
    const { idOf, repo, service } = await setup();
    await service.update(idOf("Travel"), { position: 0 });

    const expense = repo
      .rows()
      .filter((row) => row.kind === "expense")
      .toSorted((a, b) => a.position - b.position);

    expect(expense.slice(0, 3).map((row) => row.name)).toStrictEqual([
      "Travel",
      "Rent",
      "Groceries",
    ]);
  });

  it("only lets entries use an active category of the same kind", async () => {
    const { idOf, service } = await setup();
    const rent = idOf("Rent");

    await expect(
      codeOf(service.requireForEntry(idOf("Salary"), "expense"))
    ).resolves.toBe("finances.category_kind_mismatch");

    await service.update(rent, { archived: true });

    await expect(
      codeOf(service.requireForEntry(rent, "expense"))
    ).resolves.toBe("finances.category_archived");
    // Editing an entry that already uses the archived category is fine.
    await expect(
      codeOf(service.requireForEntry(rent, "expense", rent))
    ).resolves.toBe("resolved");
  });
});
