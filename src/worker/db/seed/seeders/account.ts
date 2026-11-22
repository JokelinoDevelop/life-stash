import { eq } from "drizzle-orm";

import type { Db } from "../../../core/db";
import { hashPassword } from "../../../core/password";
import {
  authChallenges,
  households,
  userPreferences,
  users,
} from "../../schema/core";
import { DEMO_ACCOUNT } from "../fixtures/account";

/** Deletes every household (and, by cascade, everything in it). */
export const wipeAllData = async (db: Db): Promise<void> => {
  await db.batch([db.delete(households), db.delete(authChallenges)]);
};

/** Removes the demo account's household so the seed can run again. Other accounts are kept. */
const removeDemoHousehold = async (db: Db): Promise<void> => {
  const [existing] = await db
    .select({ householdId: users.householdId })
    .from(users)
    .where(eq(users.email, DEMO_ACCOUNT.email))
    .limit(1);

  if (existing) {
    await db.delete(households).where(eq(households.id, existing.householdId));
  }
};

/**
 * The foundation every other seeder builds on: a household with one member (the admin) who can
 * sign in with email and password. Returns the household id.
 */
export const createDemoAccount = async (db: Db): Promise<string> => {
  await removeDemoHousehold(db);

  const householdId = crypto.randomUUID();
  const userId = crypto.randomUUID();
  const passwordHash = await hashPassword(DEMO_ACCOUNT.password);

  await db.batch([
    db
      .insert(households)
      .values({ id: householdId, name: DEMO_ACCOUNT.householdName }),
    db.insert(users).values({
      displayName: DEMO_ACCOUNT.displayName,
      email: DEMO_ACCOUNT.email,
      id: userId,
      isAdmin: true,
      householdId,
      passwordHash,
    }),
    db.insert(userPreferences).values({
      currency: DEMO_ACCOUNT.currency,
      distanceUnit: DEMO_ACCOUNT.distanceUnit,
      locale: DEMO_ACCOUNT.locale,
      timeZone: DEMO_ACCOUNT.timeZone,
      userId,
    }),
  ]);

  return householdId;
};
