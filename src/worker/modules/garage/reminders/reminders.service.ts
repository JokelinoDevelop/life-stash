import { and, desc, eq, isNotNull } from "drizzle-orm";

import type { Db } from "../../../core/db";
import { notFound } from "../../../core/errors";
import { garageReminders } from "../../../db/schema/garage";

export type ReminderRow = typeof garageReminders.$inferSelect;

const RECENT_COMPLETED = 10;

export const findReminder = async (
  db: Db,
  householdId: string,
  reminderId: string
): Promise<ReminderRow> => {
  const [reminder] = await db
    .select()
    .from(garageReminders)
    .where(
      and(
        eq(garageReminders.id, reminderId),
        eq(garageReminders.householdId, householdId)
      )
    )
    .limit(1);

  if (!reminder) {
    throw notFound();
  }

  return reminder;
};

export const recentlyCompleted = async (
  db: Db,
  householdId: string,
  carId: string
) =>
  await db
    .select()
    .from(garageReminders)
    .where(
      and(
        eq(garageReminders.householdId, householdId),
        eq(garageReminders.carId, carId),
        isNotNull(garageReminders.completedAt)
      )
    )
    .orderBy(desc(garageReminders.completedAt))
    .limit(RECENT_COMPLETED);
