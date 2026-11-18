import { and, eq } from "drizzle-orm";

import type { Db } from "../../../core/db";
import { notFound } from "../../../core/errors";
import { garageOdometerReadings } from "../../../db/schema/garage";

export type ReadingRow = typeof garageOdometerReadings.$inferSelect;

/** Loads a manual odometer reading of the household or throws 404. */
export const findReading = async (
  db: Db,
  householdId: string,
  readingId: string
): Promise<ReadingRow> => {
  const [reading] = await db
    .select()
    .from(garageOdometerReadings)
    .where(
      and(
        eq(garageOdometerReadings.id, readingId),
        eq(garageOdometerReadings.householdId, householdId)
      )
    )
    .limit(1);

  if (!reading) {
    throw notFound();
  }

  return reading;
};
