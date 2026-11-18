import { and, eq, gt } from "drizzle-orm";
import type { Context } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";

import { sessions, users } from "../db/schema/core";
import type { AuthContext } from "./app-env";
import { randomToken, sha256Hex } from "./crypto";
import type { Db } from "./db";

const SESSION_COOKIE = "ls_session";
const DAY_MS = 86_400_000;
const SESSION_DAYS = 90;
const REFRESH_WHEN_DAYS_LEFT = 60;

const cookieOptions = (c: Context) => ({
  httpOnly: true,
  maxAge: SESSION_DAYS * 86_400,
  path: "/",
  sameSite: "Lax" as const,
  secure: new URL(c.req.url).protocol === "https:",
});

const expiryFromNow = () =>
  new Date(Date.now() + SESSION_DAYS * DAY_MS).toISOString();

export const createSession = async (
  c: Context,
  db: Db,
  userId: string
): Promise<void> => {
  const token = randomToken();
  await db.insert(sessions).values({
    expiresAt: expiryFromNow(),
    id: await sha256Hex(token),
    userId,
  });
  setCookie(c, SESSION_COOKIE, token, cookieOptions(c));
};

/** Resolves the current session, sliding its expiry when it gets old. */
export const readSession = async (
  c: Context,
  db: Db
): Promise<AuthContext | null> => {
  const token = getCookie(c, SESSION_COOKIE);

  if (token === undefined || token === "") {
    return null;
  }

  const sessionId = await sha256Hex(token);
  const nowIso = new Date().toISOString();

  const [row] = await db
    .select({
      expiresAt: sessions.expiresAt,
      householdId: users.householdId,
      userId: users.id,
    })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.id, sessionId), gt(sessions.expiresAt, nowIso)))
    .limit(1);

  if (!row) {
    return null;
  }

  const daysLeft = (Date.parse(row.expiresAt) - Date.now()) / DAY_MS;

  if (daysLeft < REFRESH_WHEN_DAYS_LEFT) {
    await db
      .update(sessions)
      .set({ expiresAt: expiryFromNow() })
      .where(eq(sessions.id, sessionId));
    setCookie(c, SESSION_COOKIE, token, cookieOptions(c));
  }

  return { householdId: row.householdId, userId: row.userId };
};

export const destroySession = async (c: Context, db: Db): Promise<void> => {
  const token = getCookie(c, SESSION_COOKIE);

  if (token !== undefined && token !== "") {
    await db.delete(sessions).where(eq(sessions.id, await sha256Hex(token)));
  }

  deleteCookie(c, SESSION_COOKIE, { path: "/" });
};
