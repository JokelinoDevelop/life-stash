import { and, desc, eq, inArray, isNotNull } from "drizzle-orm";

import type { Db } from "../../../core/db";
import { notFound } from "../../../core/errors";
import {
  garageItems,
  garagePackageItems,
  garageReminders,
} from "../../../db/schema/garage";
import { assertItemsOwned, findPackage } from "../items/items.service";

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

/** Throws unless the linked package and item belong to the household. */
export const assertReminderLinks = async (
  db: Db,
  householdId: string,
  links: { packageId: string | null; itemId: string | null }
): Promise<void> => {
  if (links.packageId !== null) {
    await findPackage(db, householdId, links.packageId);
  }

  if (links.itemId !== null) {
    await assertItemsOwned(db, householdId, [links.itemId]);
  }
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

/** Catalog items a reminder points to (its package's items, or its single item). */
const linkedItemIds = async (
  db: Db,
  reminder: ReminderRow
): Promise<string[]> => {
  if (reminder.packageId !== null) {
    const rows = await db
      .select({ itemId: garagePackageItems.itemId })
      .from(garagePackageItems)
      .where(eq(garagePackageItems.packageId, reminder.packageId));

    return rows.map((row) => row.itemId);
  }

  return reminder.itemId === null ? [] : [reminder.itemId];
};

/** Catalog items a reminder points to (its package's items, or its single item). */
export const suggestedItemsFor = async (
  db: Db,
  reminder: ReminderRow
): Promise<{ itemId: string; label: string }[]> => {
  const itemIds = await linkedItemIds(db, reminder);

  if (itemIds.length === 0) {
    return [];
  }

  const rows = await db
    .select({ id: garageItems.id, name: garageItems.name })
    .from(garageItems)
    .where(inArray(garageItems.id, itemIds));

  return rows.map((row) => ({ itemId: row.id, label: row.name }));
};
