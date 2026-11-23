import type { Db } from "../../core/db";
import {
  households,
  passkeys,
  userPreferences,
  users,
} from "../../db/schema/core";
import { seedDefaultCategories } from "../finances/categories/default-categories";
import { seedGarageCatalog } from "./catalog-seed";
import type { passkeyRow } from "./passkeys.service";
import { issueRecoveryCodes } from "./recovery";

export interface NewAccount {
  userId: string;
  displayName: string;
  timeZone: string;
  isAdmin: boolean;
  email?: string;
  passwordHash?: string;
  passkey?: ReturnType<typeof passkeyRow>;
  /** Joins this household; when missing, a new household (with starter data) is created. */
  householdId?: string;
}

/**
 * Creates a user with preferences and recovery codes. Without `householdId` it also creates their
 * household with the starter catalog and finance categories. Returns the plain recovery codes.
 */
export const createAccount = async (
  db: Db,
  account: NewAccount
): Promise<string[]> => {
  const { userId } = account;
  const joining = account.householdId !== undefined;
  const householdId = account.householdId ?? crypto.randomUUID();

  const createUser = [
    // oxlint-disable-next-line sonarjs/shorthand-property-grouping -- conflicts with sort-keys
    db.insert(users).values({
      displayName: account.displayName,
      email: account.email ?? null,
      householdId,
      id: userId,
      isAdmin: account.isAdmin,
      passwordHash: account.passwordHash ?? null,
    }),
    db.insert(userPreferences).values({ timeZone: account.timeZone, userId }),
  ] as const;

  await (joining
    ? db.batch(createUser)
    : db.batch([
        db.insert(households).values({ id: householdId, name: "Home" }),
        ...createUser,
      ]));

  if (account.passkey) {
    await db.insert(passkeys).values(account.passkey);
  }

  if (!joining) {
    await seedGarageCatalog(db, householdId);
    await seedDefaultCategories(db, householdId);
  }

  return await issueRecoveryCodes(db, userId);
};
