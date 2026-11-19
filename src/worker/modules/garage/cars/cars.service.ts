import { and, asc, eq, isNull } from "drizzle-orm";

import type { Db } from "../../../core/db";
import { notFound } from "../../../core/errors";
import { garageCars } from "../../../db/schema/garage";
import { activeReminders } from "../reminders/evaluate";
import type { CarListItemDto } from "./dto/list-cars.response";

export type CarRow = typeof garageCars.$inferSelect;

/** Loads a car of the household or throws 404. Use it to authorise any car-scoped request. */
export const findCar = async (
  db: Db,
  householdId: string,
  carId: string
): Promise<CarRow> => {
  const [car] = await db
    .select()
    .from(garageCars)
    .where(
      and(eq(garageCars.id, carId), eq(garageCars.householdId, householdId))
    )
    .limit(1);

  if (!car) {
    throw notFound();
  }

  return car;
};

export const listCars = async (
  db: Db,
  householdId: string,
  includeArchived: boolean
): Promise<CarListItemDto[]> => {
  const filters = [eq(garageCars.householdId, householdId)];

  if (!includeArchived) {
    filters.push(isNull(garageCars.archivedAt));
  }

  const [cars, active] = await Promise.all([
    db
      .select()
      .from(garageCars)
      .where(and(...filters))
      .orderBy(asc(garageCars.archivedAt), asc(garageCars.name)),
    activeReminders(db, householdId),
  ]);

  return cars.map((car) => {
    const reminders = active.reminders.filter(
      ({ reminder }) => reminder.carId === car.id
    );

    const [next] = reminders;

    return {
      archivedAt: car.archivedAt,
      dueSoonCount: reminders.filter(
        ({ evaluation }) => evaluation.status === "due-soon"
      ).length,
      id: car.id,
      latestOdometerKm: active.odometers.get(car.id)?.latestKm ?? null,
      make: car.make,
      model: car.model,
      name: car.name,
      nextReminder: next
        ? {
            daysLeft: next.evaluation.daysLeft,
            dueDate: next.reminder.dueDate,
            dueOdometerKm: next.reminder.dueOdometerKm,
            intervalKm: next.reminder.intervalKm,
            intervalMonths: next.reminder.intervalMonths,
            kmLeft: next.evaluation.kmLeft,
            status: next.evaluation.status,
            title: next.reminder.title,
          }
        : null,
      overdueCount: reminders.filter(
        ({ evaluation }) => evaluation.status === "overdue"
      ).length,
      plate: car.plate,
      year: car.year,
    };
  });
};
