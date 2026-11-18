import { and, eq, lt } from "drizzle-orm";

import type { Db } from "../../core/db";
import { badRequest } from "../../core/errors";
import { authChallenges } from "../../db/schema/core";

type Purpose = "register" | "login" | "add-passkey";

const CHALLENGE_TTL_MS = 5 * 60 * 1000;

export interface StoredChallenge {
  challenge: string;
  userId: string | null;
}

export const storeChallenge = async (
  db: Db,
  input: { challenge: string; purpose: Purpose; userId?: string }
): Promise<string> => {
  const nowIso = new Date().toISOString();
  await db.delete(authChallenges).where(lt(authChallenges.expiresAt, nowIso));

  const [row] = await db
    .insert(authChallenges)
    .values({
      challenge: input.challenge,
      expiresAt: new Date(Date.now() + CHALLENGE_TTL_MS).toISOString(),
      purpose: input.purpose,
      userId: input.userId ?? null,
    })
    .returning({ id: authChallenges.id });

  if (!row) {
    throw new Error("Failed to store challenge");
  }

  return row.id;
};

/** Returns and deletes a challenge; each challenge can be used once. */
export const consumeChallenge = async (
  db: Db,
  id: string,
  purpose: Purpose
): Promise<StoredChallenge> => {
  const [row] = await db
    .delete(authChallenges)
    .where(and(eq(authChallenges.id, id), eq(authChallenges.purpose, purpose)))
    .returning();

  if (!row || row.expiresAt < new Date().toISOString()) {
    throw badRequest("Challenge expired, please try again");
  }

  return { challenge: row.challenge, userId: row.userId };
};
