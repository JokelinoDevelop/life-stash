import { sha256Hex } from "../core/crypto";
import type { Db } from "../core/db";
import {
  households,
  sessions,
  userPreferences,
  users,
} from "../db/schema/core";

const DAY_MS = 86_400_000;

/** Test-only: a household with one member and a live session; returns the session cookie. */
export const createTestHousehold = async (
  db: Db,
  name: string
): Promise<{ householdId: string; cookie: string }> => {
  const newHouseholdId = crypto.randomUUID();
  const userId = crypto.randomUUID();
  const token = `${name}-${crypto.randomUUID()}`;

  await db.insert(households).values({ id: newHouseholdId, name });
  await db
    .insert(users)
    .values({ displayName: name, householdId: newHouseholdId, id: userId });
  await db.insert(userPreferences).values({ currency: "EUR", userId });
  await db.insert(sessions).values({
    expiresAt: new Date(Date.now() + 90 * DAY_MS).toISOString(),
    id: await sha256Hex(token),
    userId,
  });

  return { cookie: `ls_session=${token}`, householdId: newHouseholdId };
};
