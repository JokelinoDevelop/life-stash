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

  const householdId = crypto.randomUUID();
  const { userId } = stored;
  await db.batch([
    db.insert(households).values({ id: householdId, name: "Home" }),
    db
      .insert(users)
      .values({ displayName: input.displayName, id: userId, householdId }),
    db.insert(userPreferences).values({ timeZone: input.timeZone, userId }),
    db
      .insert(passkeys)
      .values(passkeyRow(credential, { deviceName: input.deviceName, userId })),
  ]);
  await seedGarageCatalog(db, householdId);
  const recoveryCodes = await issueRecoveryCodes(db, userId);

  return { recoveryCodes, userId };
};
