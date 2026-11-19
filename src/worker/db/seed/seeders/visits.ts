import { addMonths, yearOf } from "@shared/domain/dates";

import type { SeedContext, SeededCar } from "../context";
import type { BuiltVisit } from "../records/visits";
import { buildVisit, saveVisits } from "../records/visits";
import type { Seeder } from "../seeder";

const oneOffVisits = (ctx: SeedContext, car: SeededCar): BuiltVisit[] =>
  (car.fixture.visits ?? []).map((visit) => {
    const date = addMonths(ctx.today, -visit.monthsAgo);

    return buildVisit(ctx, {
      ...visit,
      car,
      date,
      currency: visit.currency ?? car.fixture.currency,
      odometerKm: car.odometerOn(date),
    });
  });

/** Service-book entries only show the year, as people rarely know more. */
const previousOwnerVisits = (ctx: SeedContext, car: SeededCar): BuiltVisit[] =>
  (car.fixture.previousOwner ?? []).map((visit) =>
    buildVisit(ctx, {
      car,
      byPreviousOwner: true,
      currency: car.fixture.currency,
      date: `${yearOf(car.ownedFrom) - visit.yearsBeforePurchase}-01-01`,
      items: visit.items,
      kind: "maintenance",
      notes: visit.notes,
      odometerKm: visit.odometerKm,
      precision: "year",
    })
  );

/** One-off visits (repairs, tyres, DIY jobs) and the previous owner's service book. */
export const visitsSeeder: Seeder = {
  name: "visits",
  run: async (ctx) =>
    await saveVisits(
      ctx,
      ctx.cars.flatMap((car) => [
        ...previousOwnerVisits(ctx, car),
        ...oneOffVisits(ctx, car),
      ])
    ),
};
