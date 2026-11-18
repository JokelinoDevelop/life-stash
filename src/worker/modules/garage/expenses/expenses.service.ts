import { and, desc, eq, gte, lt } from "drizzle-orm";

import type { Db } from "../../../core/db";
import { notFound } from "../../../core/errors";
import { garageExpenses } from "../../../db/schema/garage";

export type ExpenseRow = typeof garageExpenses.$inferSelect;

export const findExpense = async (
  db: Db,
  householdId: string,
  expenseId: string
): Promise<ExpenseRow> => {
  const [expense] = await db
    .select()
    .from(garageExpenses)
    .where(
      and(
        eq(garageExpenses.id, expenseId),
        eq(garageExpenses.householdId, householdId)
      )
    )
    .limit(1);

  if (!expense) {
    throw notFound();
  }

  return expense;
};

export const listExpenses = async (
  db: Db,
  householdId: string,
  filter: { carId: string; year: number | null }
): Promise<ExpenseRow[]> => {
  const filters = [
    eq(garageExpenses.householdId, householdId),
    eq(garageExpenses.carId, filter.carId),
  ];

  if (filter.year !== null) {
    filters.push(
      gte(garageExpenses.date, `${filter.year}-01-01`),
      lt(garageExpenses.date, `${filter.year + 1}-01-01`)
    );
  }

  return await db
    .select()
    .from(garageExpenses)
    .where(and(...filters))
    .orderBy(desc(garageExpenses.date), desc(garageExpenses.createdAt));
};
