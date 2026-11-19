import { addDays, addMonths } from "@shared/domain/dates";

import { garageExpenses } from "../../schema/garage";
import type { SeedContext, SeededCar } from "../context";
import type { FuelHabit } from "../fixtures/types";
import { insertRows } from "../insert-rows";
import type { ExpenseRow } from "../records/expenses";
import { buildExpense } from "../records/expenses";
import type { Seeder } from "../seeder";

const DAYS_PER_YEAR = 365;
const KM_PER_100 = 100;

/** Fill-ups are roughly, not exactly, every `fillEveryKm`. */
const FILL_DISTANCE_SPREAD = 0.2;
const CONSUMPTION_SPREAD = 0.06;
const PRICE_SPREAD = 0.05;

const roundTo = (value: number, decimals: number) =>
  Math.round(value * 10 ** decimals) / 10 ** decimals;

/** Walks the fuel window fill-up by fill-up; litres follow the distance driven since the last. */
const fillUps = (
  ctx: SeedContext,
  car: SeededCar,
  habit: FuelHabit
): ExpenseRow[] => {
  const windowStart = addMonths(car.ownedUntil, -habit.months);
  const kmPerDay = car.fixture.kmPerYear / DAYS_PER_YEAR;
  const fills: ExpenseRow[] = [];
  let date = windowStart < car.ownedFrom ? car.ownedFrom : windowStart;
  let lastKm = car.odometerOn(date);

  for (;;) {
    const days =
      ctx.random.jitter(habit.fillEveryKm, FILL_DISTANCE_SPREAD) / kmPerDay;

    date = addDays(date, Math.max(1, Math.round(days)));

    if (date > car.ownedUntil) {
      return fills;
    }

    const km = car.odometerOn(date);

    const consumption = ctx.random.jitter(
      habit.litresPer100Km,
      CONSUMPTION_SPREAD
    );

    const litres = roundTo(((km - lastKm) * consumption) / KM_PER_100, 2);
    const pricePerLitre = ctx.random.jitter(habit.pricePerLitre, PRICE_SPREAD);

    fills.push(
      buildExpense(ctx, {
        car,
        date,
        amount: roundTo(litres * pricePerLitre, 0),
        category: "fuel",
        odometerKm: habit.logsOdometer ? km : null,
        quantity: litres,
      })
    );
    lastKm = km;
  }
};

/** Fuel fill-ups over the last `fuel.months` of ownership. */
export const fuelSeeder: Seeder = {
  name: "fuel",
  run: async (ctx) => ({
    expenses: await insertRows(
      ctx.db,
      garageExpenses,
      ctx.cars.flatMap((car) =>
        car.fixture.fuel ? fillUps(ctx, car, car.fixture.fuel) : []
      )
    ),
  }),
};
