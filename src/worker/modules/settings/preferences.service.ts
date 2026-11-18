import { eq } from "drizzle-orm";

import type { Db } from "../../core/db";
import { notFound } from "../../core/errors";
import { userPreferences, users } from "../../db/schema/core";
import type { GetPreferencesResponse } from "./dto/get-preferences.response";

export const getPreferences = async (
  db: Db,
  userId: string
): Promise<GetPreferencesResponse> => {
  const [row] = await db
    .select({ displayName: users.displayName, prefs: userPreferences })
    .from(users)
    .innerJoin(userPreferences, eq(userPreferences.userId, users.id))
    .where(eq(users.id, userId))
    .limit(1);

  if (!row) {
    throw notFound();
  }

  return {
    currency: row.prefs.currency,
    displayName: row.displayName,
    distanceUnit: row.prefs.distanceUnit,
    locale: row.prefs.locale,
    odometerNudgeWeeks: row.prefs.odometerNudgeWeeks,
    timeZone: row.prefs.timeZone,
  };
};

export const updatePreferences = async (
  db: Db,
  userId: string,
  input: Omit<GetPreferencesResponse, "displayName"> & { displayName: string }
): Promise<void> => {
  const { displayName, ...prefs } = input;
  await db.batch([
    db.update(users).set({ displayName }).where(eq(users.id, userId)),
    db
      .update(userPreferences)
      .set(prefs)
      .where(eq(userPreferences.userId, userId)),
  ]);
};
