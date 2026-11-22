import { and, count, eq, ne, sql } from "drizzle-orm";

import type { AuthContext } from "../../core/app-env";
import type { Db } from "../../core/db";
import { ApiError, conflict, unauthorized } from "../../core/errors";
import {
  DUMMY_PASSWORD_HASH,
  hashPassword,
  verifyPassword,
} from "../../core/password";
import { endOtherSessions } from "../../core/session";
import { passkeys, users } from "../../db/schema/core";

const MAX_FAILED_LOGINS = 5;
const LOCK_MINUTES = 15;
const RECENT_SIGN_IN_MINUTES = 15;
const MINUTE_MS = 60_000;

const tooManyAttempts = () =>
  new ApiError(
    429,
    "rate_limited",
    "Too many attempts. Try again in a few minutes."
  );

const lockedUntil = () =>
  new Date(Date.now() + LOCK_MINUTES * MINUTE_MS).toISOString();

/**
 * Counts an attempt before checking the password, in one statement, so parallel requests can't
 * all read the same count: at most `MAX_FAILED_LOGINS` guesses per lock window. Returns the
 * count including this attempt.
 */
const countAttempt = async (db: Db, userId: string): Promise<number> => {
  const [row] = await db
    .update(users)
    .set({ failedLoginCount: sql`${users.failedLoginCount} + 1` })
    .where(eq(users.id, userId))
    .returning({ attempts: users.failedLoginCount });

  return row?.attempts ?? MAX_FAILED_LOGINS + 1;
};

const lock = async (db: Db, userId: string): Promise<void> => {
  await db
    .update(users)
    .set({ failedLoginCount: 0, loginLockedUntil: lockedUntil() })
    .where(eq(users.id, userId));
};

/** Checks email + password and returns the user id; locks the account after repeated failures. */
export const signInWithPassword = async (
  db: Db,
  email: string,
  password: string
): Promise<string> => {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user) {
    // Same work as a real check, so timing doesn't reveal which emails exist.
    await verifyPassword(password, DUMMY_PASSWORD_HASH);

    throw unauthorized();
  }

  if (
    user.loginLockedUntil !== null &&
    user.loginLockedUntil > new Date().toISOString()
  ) {
    throw tooManyAttempts();
  }

  const attempts = await countAttempt(db, user.id);

  if (attempts > MAX_FAILED_LOGINS) {
    await lock(db, user.id);

    throw tooManyAttempts();
  }

  const matches = await verifyPassword(
    password,
    user.passwordHash ?? DUMMY_PASSWORD_HASH
  );

  const valid = user.passwordHash !== null && matches;

  if (!valid) {
    if (attempts === MAX_FAILED_LOGINS) {
      await lock(db, user.id);
    }

    throw unauthorized();
  }

  await db
    .update(users)
    .set({ failedLoginCount: 0, loginLockedUntil: null })
    .where(eq(users.id, user.id));

  return user.id;
};

const isRecent = (auth: AuthContext): boolean =>
  Date.now() - Date.parse(auth.sessionCreatedAt) <
  RECENT_SIGN_IN_MINUTES * MINUTE_MS;

/**
 * Actions that hand out lasting access (recovery codes, passkeys) need a sign-in from the last
 * few minutes, so a stolen session cookie alone can't lock the owner out.
 */
export const requireRecentSignIn = (auth: AuthContext): void => {
  if (!isRecent(auth)) {
    throw new ApiError(403, "reauth_required", "Confirm it's you to continue");
  }
};

export const getCredentials = async (db: Db, auth: AuthContext) => {
  const [[user], [keys]] = await Promise.all([
    db
      .select({ email: users.email, passwordHash: users.passwordHash })
      .from(users)
      .where(eq(users.id, auth.userId)),
    db
      .select({ value: count() })
      .from(passkeys)
      .where(eq(passkeys.userId, auth.userId)),
  ]);

  return {
    email: user?.email ?? null,
    hasPassword: (user?.passwordHash ?? null) !== null,
    passkeyCount: keys?.value ?? 0,
    recentlySignedIn: isRecent(auth),
  };
};

export interface CredentialsUpdate {
  email: string;
  currentPassword: string | null;
  newPassword: string | null;
}

/**
 * Sets the sign-in email and (optionally) a new password. Changing credentials needs the current
 * password unless there is none yet or the user signed in within the last few minutes (e.g. via a
 * passkey or a recovery code).
 */
export const updateCredentials = async (
  db: Db,
  auth: AuthContext,
  update: CredentialsUpdate
): Promise<void> => {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, auth.userId))
    .limit(1);

  if (!user) {
    throw unauthorized();
  }

  if (user.passwordHash !== null && !isRecent(auth)) {
    const valid =
      update.currentPassword !== null &&
      (await verifyPassword(update.currentPassword, user.passwordHash));

    if (!valid) {
      throw new ApiError(403, "forbidden", "Current password is incorrect");
    }
  }

  if (user.passwordHash === null && update.newPassword === null) {
    throw new ApiError(400, "bad_request", "Choose a password");
  }

  const [taken] = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.email, update.email), ne(users.id, user.id)))
    .limit(1);

  if (taken) {
    throw conflict("That email is already in use");
  }

  await db
    .update(users)
    .set({
      email: update.email,
      passwordHash:
        update.newPassword === null
          ? user.passwordHash
          : await hashPassword(update.newPassword),
    })
    .where(eq(users.id, user.id));

  // New sign-in details: anyone signed in elsewhere (with the old ones) is signed out.
  if (update.newPassword !== null || update.email !== user.email) {
    await endOtherSessions(db, auth);
  }
};
