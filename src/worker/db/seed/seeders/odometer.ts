import { addDays } from "@shared/domain/dates";

import { garageOdometerReadings } from "../../schema/garage";
import type { SeedContext, SeededCar } from "../context";
import { insertRows } from "../insert-rows";
import type { Seeder } from "../seeder";

const DAYS_PER_WEEK = 7;

type ReadingRow = typeof garageOdometerReadings.$inferInsert;

/** Readings every `everyWeeks`, the newest `lastWeeksAgo` weeks ago. Active cars only. */
const readings = (ctx: SeedContext, car: SeededCar): ReadingRow[] => {
  const habit = car.fixture.readings;

  if (!habit || !car.isActive) {
    return [];
  }

  return Array.from({ length: habit.count }, (_, index) =>
    addDays(
      ctx.today,
      -DAYS_PER_WEEK * (habit.lastWeeksAgo + index * habit.everyWeeks)
    )
  ).flatMap((date) =>
    date < car.ownedFrom
      ? []
      : [
          {
            date,
            carId: car.id,
            householdId: ctx.householdId,
            id: crypto.randomUUID(),
            odometerKm: car.odometerOn(date),
          },
        ]
  );
};

/** Odometer readings logged on their own (visits and fill-ups add more). */
export const odometerSeeder: Seeder = {
  name: "odometer",
  run: async (ctx) => ({
    readings: await insertRows(
      ctx.db,
      garageOdometerReadings,
      ctx.cars.flatMap((car) => readings(ctx, car))
    ),
  }),
};
