import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { households } from "./core";

const id = () =>
  text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());

const now = () => new Date().toISOString();

const createdAt = () => text("created_at").notNull().$defaultFn(now);

const timestamps = {
  createdAt: createdAt(),
  updatedAt: text("updated_at").notNull().$defaultFn(now).$onUpdateFn(now),
};

const householdId = () =>
  text("household_id")
    .notNull()
    .references(() => households.id, { onDelete: "cascade" });

const currency = (name: string) => text(name, { enum: ["MKD", "EUR", "USD"] });

const transactionKind = () =>
  text("kind", { enum: ["income", "expense"] }).notNull();

export const financeCategories = sqliteTable(
  "finance_categories",
  {
    archivedAt: text("archived_at"),
    createdAt: createdAt(),
    householdId: householdId(),
    /** A lucide icon name from `CATEGORY_ICONS`. */
    icon: text("icon"),
    id: id(),
    kind: transactionKind(),
    name: text("name").notNull(),
    position: integer("position").notNull().default(0),
    /** Set on categories the app relies on (`invoices`); those can't be changed or removed. */
    systemKey: text("system_key", { enum: ["invoices"] }),
  },
  (table) => [
    index("finance_categories_household_idx").on(table.householdId, table.kind),
  ]
);

export const financeTransactions = sqliteTable(
  "finance_transactions",
  {
    ...timestamps,
    /** Always positive; `kind` says which way the money went. */
    amountMinor: integer("amount_minor").notNull(),
    categoryId: text("category_id")
      .notNull()
      .references(() => financeCategories.id),
    currency: currency("currency").notNull(),
    date: text("date").notNull(),
    /** Soft delete, so a delete can be undone; the daily cron purges rows after 7 days. */
    deletedAt: text("deleted_at"),
    description: text("description").notNull(),
    householdId: householdId(),
    id: id(),
    kind: transactionKind(),
    notes: text("notes"),
  },
  (table) => [
    index("finance_transactions_date_idx").on(table.householdId, table.date),
    index("finance_transactions_category_idx").on(
      table.householdId,
      table.categoryId
    ),
    index("finance_transactions_deleted_idx")
      .on(table.deletedAt)
      .where(sql`${table.deletedAt} IS NOT NULL`),
  ]
);
