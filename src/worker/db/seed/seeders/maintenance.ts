import { addDays, addMonths } from "@shared/domain/dates";

import { garageReminders } from "../../schema/garage";
import type { SeedContext, SeededCar } from "../context";
import type { MaintenancePlan } from "../fixtures/types";
import { insertRows } from "../insert-rows";
import type { ReminderRow } from "../records/reminders";
import { buildRecurringReminder } from "../records/reminders";
import type { BuiltVisit } from "../records/visits";
import { buildVisit, saveVisits } from "../records/visits";
import type { Seeder } from "../seeder";

/** Past rounds drift a little around their ideal date, like real life. */
const DATE_DRIFT_DAYS = 10;

const clampToOwnership = (car: SeededCar, date: string) => {
  if (date < car.ownedFrom) {
    return car.ownedFrom;
  }

  return date > car.ownedUntil ? car.ownedUntil : date;
};

/**
 * Dates of past rounds, newest first: counted back from the next due date one interval at a
 * time, within ownership. The newest is exact, so the reminder lands on `nextDueInDays`.
 */
const pastRounds = (
  ctx: SeedContext,
  car: SeededCar,
  plan: MaintenancePlan
) => {
  const nextDue = addDays(car.ownedUntil, plan.nextDueInDays);
  const dates: string[] = [];

  for (
    let date = addMonths(nextDue, -plan.everyMonths);
    date >= car.ownedFrom;
    date = addMonths(date, -plan.everyMonths)
  ) {
    if (date <= car.ownedUntil) {
      const drift =
        dates.length === 0
          ? 0
          : ctx.random.int(-DATE_DRIFT_DAYS, DATE_DRIFT_DAYS);

      dates.push(clampToOwnership(car, addDays(date, drift)));
    }
  }

  return dates;
};

const planTarget = (ctx: SeedContext, plan: MaintenancePlan) => {
  if (plan.package !== undefined) {
    const pkg = ctx.catalog.package(plan.package);

    return { items: pkg.items, packageId: pkg.id, title: plan.package };
  }

  if (plan.item !== undefined) {
    return {
      itemId: ctx.catalog.itemId(plan.item),
      items: [plan.item],
      title: plan.item,
    };
  }

  throw new Error("A maintenance plan needs a package or an item");
};

const seedPlan = (ctx: SeedContext, car: SeededCar, plan: MaintenancePlan) => {
  const target = planTarget(ctx, plan);

  const visits = pastRounds(ctx, car, plan).map((date) =>
    buildVisit(ctx, {
      car,
      date,
      currency: car.fixture.currency,
      items: target.items,
      kind: "maintenance",
      labour: Math.round(ctx.random.jitter(plan.labour, 0.1)),
      odometerKm: car.odometerOn(date),
      shop: plan.shop,
    })
  );

  const [latest] = visits;

  const reminders =
    latest && car.isActive
      ? buildRecurringReminder(ctx, {
          car,
          intervalKm: plan.everyKm,
          intervalMonths: plan.everyMonths,
          itemId: target.itemId,
          kind: "service",
          lastDone: {
            date: latest.visit.date,
            odometerKm: latest.visit.odometerKm ?? null,
            visitId: latest.visit.id,
          },
          packageId: target.packageId,
          title: target.title,
        })
      : [];

  return { reminders, visits };
};

/** Recurring services (`maintenance` in the fixtures): their visit history and next reminder. */
export const maintenanceSeeder: Seeder = {
  name: "maintenance",
  run: async (ctx) => {
    const visits: BuiltVisit[] = [];
    const reminders: ReminderRow[] = [];

    for (const car of ctx.cars) {
      for (const plan of car.fixture.maintenance ?? []) {
        const seeded = seedPlan(ctx, car, plan);
        visits.push(...seeded.visits);
        reminders.push(...seeded.reminders);
      }
    }

    const saved = await saveVisits(ctx, visits);

    return {
      ...saved,
      reminders: await insertRows(ctx.db, garageReminders, reminders),
    };
  },
};
