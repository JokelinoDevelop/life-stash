import { addMonths } from "@shared/domain/dates";
import type { ReminderKind } from "@shared/domain/garage-kinds";

import type { garageReminders } from "../../schema/garage";
import type { SeedContext, SeededCar } from "../context";

export type ReminderRow = typeof garageReminders.$inferInsert;

/** The record that completed the previous round of a recurring reminder. */
export interface LastDone {
  date: string;
  odometerKm: number | null;
  visitId?: string;
  expenseId?: string;
}

export interface RecurringReminderSpec {
  car: SeededCar;
  kind: ReminderKind;
  title: string;
  packageId?: string;
  itemId?: string;
  intervalMonths: number;
  intervalKm?: number;
  notes?: string;
  lastDone: LastDone;
}

const kmAfter = (km: number | null, interval: number | undefined) =>
  km === null || interval === undefined ? null : km + interval;

/**
 * A recurring reminder as the app leaves it after completion: the completed round, linked to
 * the record that completed it, and the next active round scheduled one interval later.
 */
export const buildRecurringReminder = (
  ctx: SeedContext,
  spec: RecurringReminderSpec
): ReminderRow[] => {
  const { lastDone } = spec;
  const completedId = crypto.randomUUID();

  const shared = {
    carId: spec.car.id,
    householdId: ctx.householdId,
    intervalKm: spec.intervalKm ?? null,
    intervalMonths: spec.intervalMonths,
    itemId: spec.itemId ?? null,
    kind: spec.kind,
    notes: spec.notes ?? null,
    packageId: spec.packageId ?? null,
    title: spec.title,
  };

  const completed: ReminderRow = {
    ...shared,
    completedAt: `${lastDone.date}T10:00:00.000Z`,
    completedExpenseId: lastDone.expenseId ?? null,
    completedVisitId: lastDone.visitId ?? null,
    dueDate: lastDone.date,
    dueOdometerKm: spec.intervalKm === undefined ? null : lastDone.odometerKm,
    id: completedId,
  };

  const next: ReminderRow = {
    ...shared,
    dueDate: addMonths(lastDone.date, spec.intervalMonths),
    dueOdometerKm: kmAfter(lastDone.odometerKm, spec.intervalKm),
    id: crypto.randomUUID(),
    previousReminderId: completedId,
  };

  return [completed, next];
};
