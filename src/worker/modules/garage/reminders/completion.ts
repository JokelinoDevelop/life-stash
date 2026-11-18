import { nextRecurrence } from "@shared/domain/reminders";
import { and, eq, isNull } from "drizzle-orm";

import type { Db } from "../../../core/db";
import { notFound } from "../../../core/errors";
import { garageReminders } from "../../../db/schema/garage";

export interface CompleteReminderInput {
  householdId: string;
  reminderId: string;
  completedOn: string;
  completedAtKm: number | null;
  visitId?: string;
  expenseId?: string;
}

/**
 * Completes an active reminder and, when it recurs, schedules the next one.
 * Returns the id of the next reminder, or null when it does not recur.
 */
export const completeReminder = async (
  db: Db,
  input: CompleteReminderInput
): Promise<string | null> => {
  const [reminder] = await db
    .select()
    .from(garageReminders)
    .where(
      and(
        eq(garageReminders.id, input.reminderId),
        eq(garageReminders.householdId, input.householdId),
        isNull(garageReminders.completedAt)
      )
    )
    .limit(1);

  if (!reminder) {
    throw notFound();
  }

  const next = nextRecurrence({
    completedAtKm: input.completedAtKm,
    completedOn: input.completedOn,
    intervalKm: reminder.intervalKm,
    intervalMonths: reminder.intervalMonths,
    previous: {
      dueDate: reminder.dueDate,
      dueOdometerKm: reminder.dueOdometerKm,
    },
  });

  const nextId = next ? crypto.randomUUID() : null;

  const completion = db
    .update(garageReminders)
    .set({
      completedAt: new Date().toISOString(),
      completedExpenseId: input.expenseId ?? null,
      completedVisitId: input.visitId ?? null,
    })
    .where(eq(garageReminders.id, reminder.id));

  if (!next || nextId === null) {
    await completion;

    return null;
  }

  await db.batch([
    completion,
    db.insert(garageReminders).values({
      carId: reminder.carId,
      dueDate: next.dueDate,
      dueOdometerKm: next.dueOdometerKm,
      householdId: reminder.householdId,
      id: nextId,
      intervalKm: reminder.intervalKm,
      intervalMonths: reminder.intervalMonths,
      itemId: reminder.itemId,
      kind: reminder.kind,
      notes: reminder.notes,
      packageId: reminder.packageId,
      previousReminderId: reminder.id,
      title: reminder.title,
    }),
  ]);

  return nextId;
};
