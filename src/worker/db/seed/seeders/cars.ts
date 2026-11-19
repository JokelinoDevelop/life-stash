import {
  addMonths,
  normalizePartialDate,
  parseIsoDate,
} from "@shared/domain/dates";
import { toMinor } from "@shared/domain/money";

import { garageCars } from "../../schema/garage";
import type { SeedContext, SeededCar } from "../context";
import { CAR_FIXTURES } from "../fixtures/cars";
import type { CarFixture } from "../fixtures/types";
import { insertRows } from "../insert-rows";
import { createMileage } from "../mileage";
import type { Seeder } from "../seeder";

const toSeededCar = (ctx: SeedContext, fixture: CarFixture): SeededCar => {
  const { purchase, sold } = fixture;

  // A month- or year-precision purchase is stored as the 1st of that month / 1 January.
  const ownedFrom = normalizePartialDate(
    purchase.precision,
    parseIsoDate(addMonths(ctx.today, -purchase.monthsAgo))
  );

  const ownedUntil = sold ? addMonths(ctx.today, -sold.monthsAgo) : ctx.today;

  return {
    id: crypto.randomUUID(),
    isActive: sold === undefined,
    odometerOn: createMileage({
      from: ownedFrom,
      kmPerYear: fixture.kmPerYear,
      startKm: purchase.odometerKm,
      until: ownedUntil,
    }),
    fixture,
    ownedFrom,
    ownedUntil,
  };
};

const carRow = (ctx: SeedContext, car: SeededCar) => {
  const { details, purchase } = car.fixture;

  return {
    ...details,
    archivedAt: car.isActive ? null : `${car.ownedUntil}T12:00:00.000Z`,
    householdId: ctx.householdId,
    id: car.id,
    purchaseCurrency: purchase.price?.currency ?? null,
    purchaseDate: car.ownedFrom,
    purchaseDatePrecision: purchase.precision,
    purchaseOdometerKm: purchase.odometerKm,
    purchasePriceMinor: purchase.price ? toMinor(purchase.price.amount) : null,
    soldDate: car.isActive ? null : car.ownedUntil,
  };
};

/** Inserts the cars from `fixtures/cars.ts` and registers them on `ctx.cars`. */
export const carsSeeder: Seeder = {
  name: "cars",
  run: async (ctx) => {
    ctx.cars = CAR_FIXTURES.map((fixture) => toSeededCar(ctx, fixture));

    const cars = await insertRows(
      ctx.db,
      garageCars,
      ctx.cars.map((car) => carRow(ctx, car))
    );

    return {
      sold: ctx.cars.filter((car) => !car.isActive).length,
      cars,
    };
  },
};
