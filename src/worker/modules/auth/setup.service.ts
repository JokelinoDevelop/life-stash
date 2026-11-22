import type { RegistrationResponseJSON } from "@simplewebauthn/server";
import { count } from "drizzle-orm";

import type { Db } from "../../core/db";
import { badRequest, conflict } from "../../core/errors";
import {
  households,
  passkeys,
  userPreferences,
  users,
} from "../../db/schema/core";
import { seedDefaultCategories } from "../finances/categories/default-categories";
import { seedGarageCatalog } from "./catalog-seed";
import { consumeChallenge, storeChallenge } from "./challenges";
import {
  passkeyRow,
  registrationOptions,
  verifyRegistration,
} from "./passkeys.service";
import { issueRecoveryCodes } from "./recovery";
import type { RelyingParty } from "./relying-party";

export const isSetupRequired = async (db: Db): Promise<boolean> => {
  const [row] = await db.select({ value: count() }).from(users);

  return (row?.value ?? 0) === 0;
};

const assertSetupAllowed = async (db: Db) => {
  if (!(await isSetupRequired(db))) {
    throw conflict("LifeStash is already set up");
  }
};

export const startSetup = async (
  db: Db,
  rp: RelyingParty,
  displayName: string
) => {
  await assertSetupAllowed(db);
  const userId = crypto.randomUUID();

  const options = await registrationOptions(
    rp,
    { id: userId, name: displayName },
    []
  );

  const challengeId = await storeChallenge(db, {
    challenge: options.challenge,
    purpose: "register",
    userId,
  });

  return { challengeId, options };
};

interface NewAccount {
  userId: string;
  displayName: string;
  timeZone: string;
  email?: string;
  passwordHash?: string;
  passkey?: ReturnType<typeof passkeyRow>;
}

/** Creates the household, first user, preferences, starter catalog, finance categories and recovery codes. */
const createAccount = async (
  db: Db,
  account: NewAccount
): Promise<string[]> => {
  const householdId = crypto.randomUUID();
  const { userId } = account;
  await db.batch([
    db.insert(households).values({ id: householdId, name: "Home" }),
    db.insert(users).values({
      displayName: account.displayName,
      email: account.email ?? null,
      id: userId,
      passwordHash: account.passwordHash ?? null,
      householdId,
    }),
    db.insert(userPreferences).values({ timeZone: account.timeZone, userId }),
  ]);

  if (account.passkey) {
    await db.insert(passkeys).values(account.passkey);
  }

  await seedGarageCatalog(db, householdId);
  await seedDefaultCategories(db, householdId);

  return await issueRecoveryCodes(db, userId);
};

export interface FinishSetupInput {
  challengeId: string;
  displayName: string;
  deviceName: string;
  timeZone: string;
  response: RegistrationResponseJSON;
}

/** Creates the household, first user, passkey and recovery codes in one go. */
export const finishSetup = async (
  db: Db,
  rp: RelyingParty,
  input: FinishSetupInput
): Promise<{ userId: string; recoveryCodes: string[] }> => {
  await assertSetupAllowed(db);
  const stored = await consumeChallenge(db, input.challengeId, "register");

  if (stored.userId === null) {
    throw badRequest();
  }

  const credential = await verifyRegistration(
    rp,
    input.response,
    stored.challenge
  );

  const { userId } = stored;

  const recoveryCodes = await createAccount(db, {
    displayName: input.displayName,
    passkey: passkeyRow(credential, { deviceName: input.deviceName, userId }),
    timeZone: input.timeZone,
    userId,
  });

  return { recoveryCodes, userId };
};

export interface FinishPasswordSetupInput {
  displayName: string;
  email: string;
  passwordHash: string;
  timeZone: string;
}

/** First-run setup with email and password (for devices without passkeys). */
export const finishPasswordSetup = async (
  db: Db,
  input: FinishPasswordSetupInput
): Promise<{ userId: string; recoveryCodes: string[] }> => {
  await assertSetupAllowed(db);
  const userId = crypto.randomUUID();
  const recoveryCodes = await createAccount(db, { ...input, userId });

  return { recoveryCodes, userId };
};
