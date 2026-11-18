import { asc, eq } from "drizzle-orm";

import type { Db } from "../../core/db";
import { userPreferences, users } from "../../db/schema/core";

export interface HouseholdPrefs {
  locale: "en" | "mk";
  distanceUnit: "km" | "mi";
  timeZone: string;
  odometerNudgeWeeks: number;
}

const DEFAULT_PREFS: HouseholdPrefs = {
  distanceUnit: "km",
  locale: "en",
  odometerNudgeWeeks: 4,
  timeZone: "Europe/Skopje",
};

/** Notification preferences of a household: those of its first member. */
export const householdPrefs = async (
  db: Db,
  householdId: string
): Promise<HouseholdPrefs> => {
  const [row] = await db
    .select({
      distanceUnit: userPreferences.distanceUnit,
      locale: userPreferences.locale,
      odometerNudgeWeeks: userPreferences.odometerNudgeWeeks,
      timeZone: userPreferences.timeZone,
    })
    .from(users)
    .innerJoin(userPreferences, eq(userPreferences.userId, users.id))
    .where(eq(users.householdId, householdId))
    .orderBy(asc(users.createdAt))
    .limit(1);

  return row ?? DEFAULT_PREFS;
};
