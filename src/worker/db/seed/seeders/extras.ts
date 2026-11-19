import { addDays, addMonths, daysBetween } from "@shared/domain/dates";

import { garageExpenses } from "../../schema/garage";
import type { SeedContext, SeededCar } from "../context";
import type { ExtraExpense } from "../fixtures/types";
import { insertRows } from "../insert-rows";
import type { ExpenseRow } from "../records/expenses";
import { buildExpense } from "../records/expenses";
import type { Seeder } from "../seeder";

const MONTHS_PER_YEAR = 12;
const AMOUNT_SPREAD = 0.15;
const ROUND_TO = 10;

/** `timesPerYear` payments on random days of the last year of ownership. */
const payments = (
  ctx: SeedContext,
  car: SeededCar,
  extra: ExtraExpense
): ExpenseRow[] => {
  const yearAgo = addMonths(car.ownedUntil, -MONTHS_PER_YEAR);
  const start = yearAgo < car.ownedFrom ? car.ownedFrom : yearAgo;
  const span = daysBetween(start, car.ownedUntil);

  return Array.from({ length: extra.timesPerYear }, () => {
    const amount = ctx.random.jitter(extra.amount, AMOUNT_SPREAD);

    return buildExpense(ctx, {
      car,
      amount: Math.max(ROUND_TO, Math.round(amount / ROUND_TO) * ROUND_TO),
      category: extra.category,
      date: addDays(start, ctx.random.int(0, span)),
      notes: extra.notes,
    });
  });
};

/** Small recurring costs: tolls, parking, car washes. */
export const extrasSeeder: Seeder = {
  name: "extras",
  run: async (ctx) => ({
    expenses: await insertRows(
      ctx.db,
      garageExpenses,
      ctx.cars.flatMap((car) =>
        (car.fixture.extras ?? []).flatMap((extra) => payments(ctx, car, extra))
      )
    ),
  }),
};
