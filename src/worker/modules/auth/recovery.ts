import { and, count, eq, isNull } from "drizzle-orm";

import {
  generateRecoveryCode,
  normalizeRecoveryCode,
  sha256Hex,
} from "../../core/crypto";
import type { Db } from "../../core/db";
import { recoveryCodes } from "../../db/schema/core";

const RECOVERY_CODE_COUNT = 10;

/** Replaces all recovery codes for a user and returns the new plain codes once. */
export const issueRecoveryCodes = async (
  db: Db,
  userId: string
): Promise<string[]> => {
  const codes = Array.from(
    { length: RECOVERY_CODE_COUNT },
    generateRecoveryCode
  );

  const hashes = await Promise.all(
    codes.map(async (code) => await sha256Hex(code))
  );

  await db.batch([
    db.delete(recoveryCodes).where(eq(recoveryCodes.userId, userId)),
    db
      .insert(recoveryCodes)
      .values(hashes.map((codeHash) => ({ codeHash, userId }))),
  ]);

  return codes;
};

export const countRemainingCodes = async (
  db: Db,
  userId: string
): Promise<number> => {
  const [row] = await db
    .select({ value: count() })
    .from(recoveryCodes)
    .where(and(eq(recoveryCodes.userId, userId), isNull(recoveryCodes.usedAt)));

  return row?.value ?? 0;
};

/** Marks a matching unused code as used and returns its user, or null. */
export const redeemRecoveryCode = async (
  db: Db,
  input: string
): Promise<string | null> => {
  const codeHash = await sha256Hex(normalizeRecoveryCode(input));

  const [row] = await db
    .update(recoveryCodes)
    .set({ usedAt: new Date().toISOString() })
    .where(
      and(eq(recoveryCodes.codeHash, codeHash), isNull(recoveryCodes.usedAt))
    )
    .returning({ userId: recoveryCodes.userId });

  return row?.userId ?? null;
};
