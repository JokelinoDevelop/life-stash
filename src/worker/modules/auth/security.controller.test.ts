import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";

import { app } from "../../app";
import { sha256Hex } from "../../core/crypto";
import { createDb } from "../../core/db";
import type { Db } from "../../core/db";
import { hashPassword } from "../../core/password";
import { pushSubscriptions, sessions, users } from "../../db/schema/core";
import { createTestHousehold } from "../../test/households";
import { createTestD1 } from "../../test/sqlite-d1";

const ORIGIN = "http://localhost";
const EMAIL = "owner@example.com";
const PASSWORD = "correct horse battery";
const HOUR_MS = 3_600_000;
const DAY_MS = 86_400_000;
const PARALLEL_GUESSES = 10;
const MAX_FAILED_LOGINS = 5;

interface Env {
  DB: D1Database;
  AUTH_LIMITER?: RateLimit;
}

const send = async (
  env: Env,
  method: string,
  path: string,
  options: { cookie?: string; body?: unknown } = {}
) =>
  await app.request(
    `${ORIGIN}/api${path}`,
    {
      body:
        options.body === undefined ? undefined : JSON.stringify(options.body),
      headers: {
        "content-type": "application/json",
        cookie: options.cookie ?? "",
        origin: ORIGIN,
      },
      method,
    },
    env
  );

/** Whether a session cookie still works. */
const statusFor = async (env: Env, cookie: string): Promise<number> => {
  const response = await send(env, "GET", "/account/credentials", { cookie });

  return response.status;
};

/** Another live session for the same user (e.g. a second device, or a stolen cookie). */
const addSession = async (
  db: Db,
  userId: string,
  createdAt = new Date().toISOString()
): Promise<string> => {
  const token = crypto.randomUUID();
  // oxlint-disable-next-line sonarjs/shorthand-property-grouping -- conflicts with sort-keys
  await db.insert(sessions).values({
    createdAt,
    expiresAt: new Date(Date.now() + 90 * DAY_MS).toISOString(),
    id: await sha256Hex(token),
    userId,
  });

  return `ls_session=${token}`;
};

describe("security controls", () => {
  let env: Env = { DB: createTestD1().d1 };
  let db = createDb(env.DB);
  let userId = "";

  beforeEach(async () => {
    env = { DB: createTestD1().d1 };
    db = createDb(env.DB);
    await createTestHousehold(db, "Owner");
    const [user] = await db.select().from(users);
    userId = user?.id ?? "";
    await db
      .update(users)
      .set({ email: EMAIL, passwordHash: await hashPassword(PASSWORD) })
      .where(eq(users.id, userId));
  });

  it("allows at most five password guesses, even in parallel", async () => {
    const responses = await Promise.all(
      Array.from(
        { length: PARALLEL_GUESSES },
        async (_, index) =>
          await send(env, "POST", "/auth/login/password", {
            body: { email: EMAIL, password: `wrong guess ${index}` },
          })
      )
    );

    const statuses = responses.map((response) => response.status);

    expect(
      statuses.filter((status) => status === 401).length
    ).toBeLessThanOrEqual(MAX_FAILED_LOGINS);
    expect(statuses.filter((status) => status === 429).length).toBeGreaterThan(
      0
    );

    // Locked: even the right password waits for the lock to pass.
    const right = await send(env, "POST", "/auth/login/password", {
      body: { email: EMAIL, password: PASSWORD },
    });

    expect(right.status).toBe(429);
  });

  it("limits sign-in attempts per IP when the limiter is configured", async () => {
    const limited: Env = {
      ...env,
      AUTH_LIMITER: {
        limit: async () => await Promise.resolve({ success: false }),
      },
    };

    const response = await send(limited, "POST", "/auth/login/password", {
      body: { email: EMAIL, password: PASSWORD },
    });

    expect(response.status).toBe(429);
  });

  it("asks an old session to confirm it's you before new recovery codes", async () => {
    const old = await addSession(
      db,
      userId,
      new Date(Date.now() - HOUR_MS).toISOString()
    );

    const refused = await send(env, "POST", "/account/recovery-codes", {
      cookie: old,
    });

    expect(refused.status).toBe(403);
    await expect(refused.json()).resolves.toMatchObject({
      error: { code: "reauth_required" },
    });
  });

  it("signs out other sessions after new recovery codes or a new password", async () => {
    const fresh = await addSession(db, userId);
    const elsewhere = await addSession(db, userId);

    const codes = await send(env, "POST", "/account/recovery-codes", {
      cookie: fresh,
    });

    expect(codes.status).toBe(200);
    await expect(statusFor(env, elsewhere)).resolves.toBe(401);
    await expect(statusFor(env, fresh)).resolves.toBe(200);

    const another = await addSession(db, userId);

    await send(env, "PUT", "/account/credentials", {
      body: {
        currentPassword: PASSWORD,
        email: EMAIL,
        newPassword: "a new long password",
      },
      cookie: fresh,
    });

    await expect(statusFor(env, another)).resolves.toBe(401);
  });

  it("refuses file keys outside the owner's folder", async () => {
    const cookie = await addSession(db, userId);
    const [user] = await db.select().from(users);
    const owner = crypto.randomUUID();

    const response = await send(env, "POST", "/photos", {
      body: {
        contentType: "image/jpeg",
        objectKey: `${user?.householdId}/expense/${owner}/../../../other/expense/x/${crypto.randomUUID()}.jpg`,
        ownerId: owner,
        ownerType: "expense",
        sizeBytes: 1000,
      },
      cookie,
    });

    expect(response.status).toBe(400);
  });

  it("only accepts push service endpoints and never takes over another user's", async () => {
    const cookie = await addSession(db, userId);
    const keys = { auth: "auth-secret", p256dh: "public-key" };

    const internal = await send(env, "POST", "/settings/push/subscriptions", {
      body: { endpoint: "https://internal.example.com/hook", keys },
      cookie,
    });

    expect(internal.status).toBe(400);

    const endpoint = "https://fcm.googleapis.com/fcm/send/abc";
    const otherUser = crypto.randomUUID();
    const [user] = await db.select().from(users);
    await db.insert(users).values({
      displayName: "Other",
      householdId: user?.householdId ?? "",
      id: otherUser,
    });
    await db
      .insert(pushSubscriptions)
      // oxlint-disable-next-line sonarjs/shorthand-property-grouping -- conflicts with sort-keys
      .values({
        auth: "theirs",
        endpoint,
        p256dh: "theirs",
        userId: otherUser,
      });

    await send(env, "POST", "/settings/push/subscriptions", {
      body: { endpoint, keys },
      cookie,
    });

    const [row] = await db
      .select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.endpoint, endpoint));

    expect(row?.userId).toBe(otherUser);
    expect(row?.auth).toBe("theirs");
  });

  it("marks API responses as not cacheable", async () => {
    const response = await send(env, "GET", "/auth/status");

    expect(response.headers.get("cache-control")).toBe("no-store");
  });
});
