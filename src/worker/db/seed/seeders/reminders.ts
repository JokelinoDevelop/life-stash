import { addDays } from "@shared/domain/dates";

import { garageReminders } from "../../schema/garage";
import type { SeedContext, SeededCar } from "../context";
import type { OneOffReminder } from "../fixtures/types";
import { insertRows } from "../insert-rows";
import type { ReminderRow } from "../records/reminders";
import type { Seeder } from "../seeder";

const reminderRow = (
  ctx: SeedContext,
  car: SeededCar,
  reminder: OneOffReminder
): ReminderRow => ({
  carId: car.id,
  dueDate:
    reminder.dueInDays === undefined
      ? null
      : addDays(ctx.today, reminder.dueInDays),
  dueOdometerKm:
    reminder.dueInKm === undefined
      ? null
      : car.odometerOn(ctx.today) + reminder.dueInKm,
  householdId: ctx.householdId,
  id: crypto.randomUUID(),
  itemId:
    reminder.item === undefined ? null : ctx.catalog.itemId(reminder.item),
  kind: reminder.kind,
  notes: reminder.notes ?? null,
  title: reminder.title,
});

/** One-off reminders that are not part of a maintenance plan or renewal. Active cars only. */
export const remindersSeeder: Seeder = {
  name: "reminders",
  run: async (ctx) => ({
    reminders: await insertRows(
      ctx.db,
      garageReminders,
      ctx.cars.flatMap((car) =>
        car.isActive
          ? (car.fixture.reminders ?? []).map((reminder) =>
              reminderRow(ctx, car, reminder)
            )
          : []
      )
    ),
  }),
};
