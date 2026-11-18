import { todayInTimeZone } from "@shared/domain/dates";
import { evaluateReminder } from "@shared/domain/reminders";
import { and, eq, inArray, isNull, or, isNotNull } from "drizzle-orm";

import type { Db } from "../../../core/db";
import type { Bindings } from "../../../core/env";
import { sendPushToHousehold } from "../../../core/push";
import { garageCars, garageReminders } from "../../../db/schema/garage";
import { householdPrefs } from "../household-prefs";
import { reminderMessage } from "../notifications";
import { odometerSummaries } from "../odometer";

/**
 * Sends the single heads-up for every active, not-yet-notified reminder that is due soon
 * or overdue. Pass `carId` to limit the check (used after logging an odometer value).
 */
export const sendReminderHeadsUps = async (
  env: Bindings,
  db: Db,
  householdId: string,
  carId?: string
): Promise<number> => {
  const filters = [
    eq(garageReminders.householdId, householdId),
    isNull(garageReminders.completedAt),
    isNull(garageReminders.notifiedAt),
    isNull(garageCars.archivedAt),
    or(
      isNotNull(garageReminders.dueDate),
      isNotNull(garageReminders.dueOdometerKm)
    ),
  ];

  if (carId !== undefined) {
    filters.push(eq(garageReminders.carId, carId));
  }

  const [rows, prefs, odometers] = await Promise.all([
    db
      .select({ carName: garageCars.name, reminder: garageReminders })
      .from(garageReminders)
      .innerJoin(garageCars, eq(garageCars.id, garageReminders.carId))
      .where(and(...filters)),
    householdPrefs(db, householdId),
    odometerSummaries(db, householdId),
  ]);

  const today = todayInTimeZone(prefs.timeZone);

  const due = rows.flatMap(({ carName, reminder }) => {
    const evaluation = evaluateReminder(reminder, {
      latestOdometerKm: odometers.get(reminder.carId)?.latestKm ?? null,
      today,
    });

    return evaluation.status === "upcoming"
      ? []
      : [{ carName, evaluation, reminder }];
  });

  if (due.length === 0) {
    return 0;
  }

  await Promise.all(
    due.map(
      async ({ carName, evaluation, reminder }) =>
        await sendPushToHousehold(
          env,
          db,
          householdId,
          reminderMessage(prefs, {
            carId: reminder.carId,
            dueDate: reminder.dueDate,
            reminderId: reminder.id,
            title: reminder.title,
            carName,
            evaluation,
          })
        )
    )
  );
  await db
    .update(garageReminders)
    .set({ notifiedAt: new Date().toISOString() })
    .where(
      inArray(
        garageReminders.id,
        due.map(({ reminder }) => reminder.id)
      )
    );

  return due.length;
};
