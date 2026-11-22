import { addDays, todayInTimeZone } from "@shared/domain/dates";
import type {
  CategoryIcon,
  TransactionKind,
} from "@shared/domain/finances/kinds";

import { domainError, notFound } from "../../../core/errors";
import type { HouseholdRepository } from "../household/household.repository";
import type {
  CategoriesRepositoryPort,
  CategoryPatch,
  CategoryRow,
} from "./categories.repository";
import { defaultCategoryRows } from "./default-categories";

export interface CategoryWithUsage extends CategoryRow {
  /** Every entry using it (decides archive vs delete). */
  entryCount: number;
  /** Entries in the last 90 days (ranks "Frequent"). */
  recentCount: number;
}

export interface CategoryChanges {
  name?: string;
  icon?: CategoryIcon | null;
  archived?: boolean;
  /** New index among the categories of the same kind. */
  position?: number;
}

const FREQUENT_WINDOW_DAYS = 90;

export class CategoriesService {
  readonly #repo: CategoriesRepositoryPort;
  readonly #household: Pick<HouseholdRepository, "preferences">;
  readonly #now: () => Date;

  constructor(
    repo: CategoriesRepositoryPort,
    household: Pick<HouseholdRepository, "preferences">,
    now: () => Date = () => new Date()
  ) {
    this.#repo = repo;
    this.#household = household;
    this.#now = now;
  }

  /** Fallback for households created before setup seeded categories. */
  async ensureDefaults(): Promise<CategoryRow[]> {
    const existing = await this.#repo.list();

    if (existing.length > 0) {
      return existing;
    }

    const { locale } = await this.#household.preferences();
    await this.#repo.insertMany(defaultCategoryRows(locale));

    return await this.#repo.list();
  }

  async list(): Promise<CategoryWithUsage[]> {
    const { timeZone } = await this.#household.preferences();

    const since = addDays(
      todayInTimeZone(timeZone, this.#now()),
      -FREQUENT_WINDOW_DAYS
    );

    const [rows, usage, recent] = await Promise.all([
      this.ensureDefaults(),
      this.#repo.usage(),
      this.#repo.recentUsage(since),
    ]);

    return rows.map((row) => ({
      ...row,
      entryCount: usage.get(row.id) ?? 0,
      recentCount: recent.get(row.id) ?? 0,
    }));
  }

  /** The system "Invoices" income category (created with the defaults if needed). */
  async invoicesCategory(): Promise<CategoryRow> {
    await this.ensureDefaults();
    const row = await this.#repo.findBySystemKey("invoices");

    if (!row) {
      throw new Error("The Invoices category is missing");
    }

    return row;
  }

  async get(categoryId: string): Promise<CategoryRow> {
    const row = await this.#repo.find(categoryId);

    if (!row) {
      throw notFound();
    }

    return row;
  }

  async create(input: {
    kind: TransactionKind;
    name: string;
    icon: CategoryIcon | null;
  }): Promise<CategoryRow> {
    await this.ensureDefaults();
    const position = (await this.#repo.maxPosition(input.kind)) + 1;

    return await this.#repo.insert({ ...input, position, systemKey: null });
  }

  async update(categoryId: string, changes: CategoryChanges): Promise<void> {
    const category = await this.get(categoryId);

    const touchesIdentity =
      changes.name !== undefined || changes.archived !== undefined;

    if (category.systemKey !== null && touchesIdentity) {
      throw domainError("finances.category_system");
    }

    const patch: CategoryPatch = {};

    if (changes.name !== undefined) {
      patch.name = changes.name;
    }

    if (changes.icon !== undefined) {
      patch.icon = changes.icon;
    }

    if (changes.archived !== undefined) {
      patch.archivedAt = changes.archived ? this.#now().toISOString() : null;
    }

    if (Object.keys(patch).length > 0) {
      await this.#repo.update(categoryId, patch);
    }

    if (changes.position !== undefined) {
      await this.#move(category, changes.position);
    }
  }

  /** Moves a category to `index` among its kind and renumbers the rest. */
  async #move(category: CategoryRow, index: number): Promise<void> {
    const all = await this.#repo.list();

    const siblings = all.filter(
      (row) => row.kind === category.kind && row.id !== category.id
    );

    const clamped = Math.max(0, Math.min(index, siblings.length));

    const ordered = [
      ...siblings.slice(0, clamped),
      category,
      ...siblings.slice(clamped),
    ];

    await this.#repo.setPositions(ordered.map((row) => row.id));
  }

  /** Deletes an unused category; one in use must be archived instead. */
  async delete(categoryId: string): Promise<void> {
    const category = await this.get(categoryId);

    if (category.systemKey !== null) {
      throw domainError("finances.category_system");
    }

    const usage = await this.#repo.usage();

    if ((usage.get(categoryId) ?? 0) > 0) {
      throw domainError("finances.category_in_use");
    }

    await this.#repo.delete(categoryId);
  }

  /**
   * The category a transaction may use: it must belong to the household, match the
   * transaction's kind and be active (an archived one is only kept when it is unchanged).
   */
  async requireForEntry(
    categoryId: string,
    kind: TransactionKind,
    keptFrom: string | null = null
  ): Promise<CategoryRow> {
    const category = await this.#repo.find(categoryId);

    if (!category) {
      throw notFound();
    }

    if (category.kind !== kind) {
      throw domainError("finances.category_kind_mismatch", {
        field: "categoryId",
        status: 400,
      });
    }

    if (category.archivedAt !== null && keptFrom !== categoryId) {
      throw domainError("finances.category_archived", {
        field: "categoryId",
        status: 400,
      });
    }

    return category;
  }
}
