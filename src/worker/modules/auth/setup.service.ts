import type { RegistrationResponseJSON } from "@simplewebauthn/server";
import { count } from "drizzle-orm";

import type { Db } from "../../core/db";
import { badRequest, conflict } from "../../core/errors";
import { users } from "../../db/schema/core";
import { createAccount } from "./accounts";
import { consumeChallenge, storeChallenge } from "./challenges";
import {
  passkeyRow,
  registrationOptions,
  verifyRegistration,
} from "./passkeys.service";
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

  const { userId } = stored;

  const recoveryCodes = await createAccount(db, {
    displayName: input.displayName,
    isAdmin: true,
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

  const recoveryCodes = await createAccount(db, {
    ...input,
    isAdmin: true,
    userId,
  });

  return { recoveryCodes, userId };
};
