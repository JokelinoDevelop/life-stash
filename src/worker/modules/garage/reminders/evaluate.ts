import { todayInTimeZone } from "@shared/domain/dates";
import { compareByUrgency, evaluateReminder } from "@shared/domain/reminders";
import type { ReminderEvaluation } from "@shared/domain/reminders";
import { and, eq, isNull } from "drizzle-orm";

import type { Db } from "../../../core/db";
import { garageReminders } from "../../../db/schema/garage";
import { householdPrefs } from "../household-prefs";
import { odometerSummaries } from "../odometer";
import type { OdometerSummary } from "../odometer";

export interface EvaluatedReminder {
  reminder: typeof garageReminders.$inferSelect;
  evaluation: ReminderEvaluation;
}

export interface ActiveReminders {
  today: string;
  odometers: Map<string, OdometerSummary>;
  reminders: EvaluatedReminder[];
}

/** Active reminders with their status, most urgent first. */
export const activeReminders = async (
  db: Db,
  householdId: string,
  carId?: string
): Promise<ActiveReminders> => {
  const filters = [
    eq(garageReminders.householdId, householdId),
    isNull(garageReminders.completedAt),
  ];

  if (carId !== undefined) {
    filters.push(eq(garageReminders.carId, carId));
  }

  const [rows, prefs, odometers] = await Promise.all([
    db
      .select()
      .from(garageReminders)
      .where(and(...filters)),
    householdPrefs(db, householdId),
    odometerSummaries(db, householdId),
  ]);

  const today = todayInTimeZone(prefs.timeZone);

  const reminders = rows
    .map((reminder) => ({
      evaluation: evaluateReminder(reminder, {
        latestOdometerKm: odometers.get(reminder.carId)?.latestKm ?? null,
        today,
      }),
      reminder,
    }))
    .toSorted((a, b) => compareByUrgency(a.evaluation, b.evaluation));

  return { odometers, reminders, today };
};
