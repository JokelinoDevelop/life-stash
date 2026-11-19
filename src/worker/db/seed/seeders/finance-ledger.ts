import { addDays, addMonths } from "@shared/domain/dates";
import { toMinor } from "@shared/domain/money";

import { DEFAULT_CATEGORIES } from "../../../modules/finances/categories/default-categories";
import { financeCategories, financeTransactions } from "../../schema/finances";
import type { SeedContext } from "../context";
import {
  LEDGER_FREELANCE,
  LEDGER_HABITS,
  LEDGER_ONE_OFFS,
  LEDGER_SALARY,
} from "../fixtures/finances";
import type { LedgerHabit } from "../fixtures/finances";
import { insertRows } from "../insert-rows";
import type { Seeder } from "../seeder";

const MONTHS = 13;
const DAYS_PER_MONTH = 28;

type TransactionRow = typeof financeTransactions.$inferInsert;

const monthStarts = (today: string): string[] =>
  Array.from({ length: MONTHS }, (_, index) =>
    addMonths(`${today.slice(0, 7)}-01`, index - MONTHS + 1)
  );

const habitDates = (ctx: SeedContext, habit: LedgerHabit, month: string) => {
  if ("monthly" in habit.schedule) {
    return [addDays(month, habit.schedule.monthly - 1)];
  }

  const { timesPerMonth } = habit.schedule;
  const whole = Math.floor(timesPerMonth);
  const count = whole + (ctx.random.chance(timesPerMonth - whole) ? 1 : 0);

  return Array.from({ length: count }, () =>
    addDays(month, ctx.random.int(0, DAYS_PER_MONTH - 1))
  );
};

const round = (amount: number) =>
  amount >= 100 ? Math.round(amount / 10) * 10 : Math.round(amount * 100) / 100;

/** Categories (the app's defaults) and a year of everyday income and spending. */
export const financeLedgerSeeder: Seeder = {
  name: "ledger",
  run: async (ctx) => {
    const categoryIds = new Map<string, string>();
    const positions = { expense: 0, income: 0 };

    const categories = DEFAULT_CATEGORIES.map((category) => {
      const categoryId = crypto.randomUUID();
      categoryIds.set(category.name.en, categoryId);
      const nextPosition = positions[category.kind];
      positions[category.kind] += 1;

      return {
        householdId: ctx.householdId,
        icon: category.icon,
        id: categoryId,
        kind: category.kind,
        name: category.name.en,
        position: nextPosition,
        systemKey: category.systemKey ?? null,
      };
    });

    ctx.finance.categoryIds = categoryIds;

    const categoryId = (name: string) => {
      const found = categoryIds.get(name);

      if (found === undefined) {
        throw new Error(`Unknown finance category "${name}"`);
      }

      return found;
    };

    const rows: TransactionRow[] = [];

    const add = (row: Omit<TransactionRow, "householdId" | "id">) => {
      if (row.date <= ctx.today) {
        rows.push({ ...row, householdId: ctx.householdId });
      }
    };

    for (const month of monthStarts(ctx.today)) {
      for (const habit of LEDGER_HABITS) {
        for (const day of habitDates(ctx, habit, month)) {
          add({
            amountMinor: toMinor(
              round(ctx.random.jitter(habit.amount, habit.spread))
            ),
            categoryId: categoryId(habit.category),
            currency: habit.currency,
            date: day,
            description: ctx.random.pick(habit.descriptions),
            kind: "expense",
          });
        }
      }

      add({
        amountMinor: toMinor(LEDGER_SALARY.amount),
        categoryId: categoryId("Salary"),
        currency: LEDGER_SALARY.currency,
        date: addDays(month, LEDGER_SALARY.day - 1),
        description: LEDGER_SALARY.description,
        kind: "income",
      });
    }

    for (const oneOff of LEDGER_ONE_OFFS) {
      add({
        amountMinor: toMinor(oneOff.amount),
        categoryId: categoryId(oneOff.category),
        currency: oneOff.currency,
        date: addDays(ctx.today, -oneOff.daysAgo),
        description: oneOff.description,
        kind: "expense",
        notes: oneOff.notes ?? null,
      });
    }

    for (const job of LEDGER_FREELANCE) {
      add({
        amountMinor: toMinor(job.amount),
        categoryId: categoryId("Freelance"),
        currency: "EUR",
        date: addDays(ctx.today, -job.daysAgo),
        description: job.description,
        kind: "income",
      });
    }

    await insertRows(ctx.db, financeCategories, categories);
    const transactions = await insertRows(ctx.db, financeTransactions, rows);

    return { categories: categories.length, transactions };
  },
};
