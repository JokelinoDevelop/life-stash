import { addDays, addMonths } from "@shared/domain/dates";

import { garageExpenses, garageReminders } from "../../schema/garage";
import type { SeedContext, SeededCar } from "../context";
import type { Renewal } from "../fixtures/types";
import { insertRows } from "../insert-rows";
import type { ExpenseRow } from "../records/expenses";
import { buildExpense } from "../records/expenses";
import type { ReminderRow } from "../records/reminders";
import { buildRecurringReminder } from "../records/reminders";
import type { Seeder } from "../seeder";

const MONTHS_PER_YEAR = 12;

/** Each year back is ~3% cheaper, so the spending chart shows prices creeping up. */
const YEARLY_PRICE_GROWTH = 0.03;

const ROUND_TO = 10;

const MAX_YEARS_BACK = 30;

const priceYearsAgo = (amount: number, yearsAgo: number) =>
  Math.round((amount * (1 - YEARLY_PRICE_GROWTH) ** yearsAgo) / ROUND_TO) *
  ROUND_TO;

const seedRenewal = (ctx: SeedContext, car: SeededCar, renewal: Renewal) => {
  const nextDue = addDays(ctx.today, renewal.nextDueInDays);

  // Paid on every anniversary before the next one, newest first, while the car was owned.
  const expenses = Array.from({ length: MAX_YEARS_BACK }, (_, index) => ({
    date: addMonths(nextDue, -MONTHS_PER_YEAR * (index + 1)),
    yearsAgo: index,
  })).flatMap(({ date, yearsAgo }) =>
    date >= car.ownedFrom && date <= car.ownedUntil
      ? [
          buildExpense(ctx, {
            car,
            date,
            amount: priceYearsAgo(renewal.amount, yearsAgo),
            category: renewal.kind,
            notes: renewal.notes,
            odometerKm: car.odometerOn(date),
          }),
        ]
      : []
  );

  const [latest] = expenses;

  const reminders =
    latest && car.isActive
      ? buildRecurringReminder(ctx, {
          car,
          intervalMonths: MONTHS_PER_YEAR,
          kind: renewal.kind,
          lastDone: {
            date: latest.date,
            expenseId: latest.id,
            odometerKm: latest.odometerKm ?? null,
          },
          notes: renewal.notes,
          title: renewal.title,
        })
      : [];

  return { expenses, reminders };
};

/** Yearly insurance and registration: the payments and the reminder for the next one. */
export const renewalsSeeder: Seeder = {
  name: "renewals",
  run: async (ctx) => {
    const expenses: ExpenseRow[] = [];
    const reminders: ReminderRow[] = [];

    for (const car of ctx.cars) {
      for (const renewal of car.fixture.renewals ?? []) {
        const seeded = seedRenewal(ctx, car, renewal);
        expenses.push(...seeded.expenses);
        reminders.push(...seeded.reminders);
      }
    }

    return {
      expenses: await insertRows(ctx.db, garageExpenses, expenses),
      reminders: await insertRows(ctx.db, garageReminders, reminders),
    };
  },
};
