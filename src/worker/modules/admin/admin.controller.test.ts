import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";

import { app } from "../../app";
import { sha256Hex } from "../../core/crypto";
import { createDb } from "../../core/db";
import type { Db } from "../../core/db";
import { households, invites, sessions, users } from "../../db/schema/core";
import { createTestHousehold } from "../../test/households";
import { createTestD1 } from "../../test/sqlite-d1";

const ORIGIN = "http://localhost";
const PASSWORD = "a long enough password";
const HOUR_MS = 3_600_000;

interface Env {
  DB: D1Database;
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

const json = async <T>(response: Response): Promise<T> =>
  // SAFETY: test-only; the shape is asserted by the expectations that follow.
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  (await response.json()) as T;

const sessionCookie = (response: Response): string =>
  (response.headers.get("set-cookie") ?? "").split(";")[0] ?? "";

const userIdOf = async (db: Db, householdId: string): Promise<string> => {
  const [row] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.householdId, householdId));

  return row?.id ?? "";
};

describe("admin and invites", () => {
  let env: Env = { DB: createTestD1().d1 };
  let db = createDb(env.DB);
  let admin = { cookie: "", householdId: "" };
  let member = { cookie: "", householdId: "" };

  const invite = async (joinMyHousehold: boolean) => {
    const response = await send(env, "POST", "/admin/invites", {
      body: { joinMyHousehold, name: "Ana" },
      cookie: admin.cookie,
    });

    expect(response.status).toBe(201);

    const { token } = await json<{ token: string }>(response);

    return token;
  };

  const accept = async (
    token: string,
    email: string,
    extra: { householdId?: string } = {}
  ) =>
    await send(env, "POST", `/auth/invites/${token}/accept`, {
      body: {
        displayName: "Ana",
        email,
        password: PASSWORD,
        timeZone: "Europe/Skopje",
        ...extra,
      },
    });

  beforeEach(async () => {
    env = { DB: createTestD1().d1 };
    db = createDb(env.DB);
    admin = await createTestHousehold(db, "Admin");
    member = await createTestHousehold(db, "Member");
    await db
      .update(users)
      .set({ isAdmin: true })
      .where(eq(users.householdId, admin.householdId));
  });

  it("only lets admins invite or list accounts", async () => {
    const asMember = await send(env, "POST", "/admin/invites", {
      body: { joinMyHousehold: true, name: null },
      cookie: member.cookie,
    });

    expect(asMember.status).toBe(403);
    await expect(
      send(env, "GET", "/admin/users", { cookie: member.cookie })
    ).resolves.toHaveProperty("status", 403);
    await expect(send(env, "GET", "/admin/users")).resolves.toHaveProperty(
      "status",
      401
    );
  });

  it("there is no public sign-up once the first account exists", async () => {
    const response = await send(env, "POST", "/auth/setup/password", {
      body: {
        displayName: "Mallory",
        email: "mallory@example.com",
        password: PASSWORD,
        timeZone: "UTC",
      },
    });

    expect(response.status).toBe(409);
  });

  it("an invite for a new household creates one; the invitee can't pick another", async () => {
    const token = await invite(false);

    const lookup = await send(env, "GET", `/auth/invites/${token}`);
    await expect(json(lookup)).resolves.toStrictEqual({ name: "Ana" });

    // Extra fields (an attempt to choose the household) are ignored.
    const response = await accept(token, "ana@example.com", {
      householdId: admin.householdId,
    });

    expect(response.status).toBe(200);

    const [ana] = await db
      .select()
      .from(users)
      .where(eq(users.email, "ana@example.com"));

    expect(ana).toMatchObject({ isAdmin: false });
    expect(ana?.householdId).not.toBe(admin.householdId);

    // Signed in straight away, in their own household.
    const status = await send(env, "GET", "/auth/status", {
      cookie: sessionCookie(response),
    });

    await expect(json(status)).resolves.toMatchObject({
      user: { displayName: "Ana", isAdmin: false },
    });
  });

  it("a link works only once", async () => {
    const token = await invite(false);
    const first = await accept(token, "ana@example.com");
    const again = await accept(token, "other@example.com");

    expect(first.status).toBe(200);
    expect(again.status).toBe(404);
    await expect(json(again)).resolves.toMatchObject({
      error: { code: "account.invite_invalid" },
    });
  });

  it("an invite into the admin's household joins it", async () => {
    const token = await invite(true);
    const response = await accept(token, "partner@example.com");

    expect(response.status).toBe(200);

    const [partner] = await db
      .select()
      .from(users)
      .where(eq(users.email, "partner@example.com"));

    expect(partner?.householdId).toBe(admin.householdId);

    const all = await db.select().from(households);
    expect(all).toHaveLength(2);
  });

  it("revoked invites stop working", async () => {
    const token = await invite(false);

    const [row] = await db
      .select({ id: invites.id })
      .from(invites)
      .where(eq(invites.tokenHash, await sha256Hex(token)));

    const revoked = await send(env, "DELETE", `/admin/invites/${row?.id}`, {
      cookie: admin.cookie,
    });

    expect(revoked.status).toBe(200);
    await expect(
      send(env, "GET", `/auth/invites/${token}`)
    ).resolves.toHaveProperty("status", 404);
  });

  it("asks an old admin session to confirm it's you before inviting", async () => {
    await db
      .update(sessions)
      .set({ createdAt: new Date(Date.now() - HOUR_MS).toISOString() });

    const response = await send(env, "POST", "/admin/invites", {
      body: { joinMyHousehold: false, name: null },
      cookie: admin.cookie,
    });

    expect(response.status).toBe(403);
    await expect(json(response)).resolves.toMatchObject({
      error: { code: "reauth_required" },
    });
  });

  it("disabling an account signs it out and blocks sign-in", async () => {
    const memberId = await userIdOf(db, member.householdId);

    const disabled = await send(env, "PATCH", `/admin/users/${memberId}`, {
      body: { disabled: true },
      cookie: admin.cookie,
    });

    expect(disabled.status).toBe(200);
    await expect(
      send(env, "GET", "/account/credentials", { cookie: member.cookie })
    ).resolves.toHaveProperty("status", 401);

    const listed = await send(env, "GET", "/admin/users", {
      cookie: admin.cookie,
    });

    const body = await json<{ users: { id: string; disabled: boolean }[] }>(
      listed
    );

    expect(
      body.users.find((row) => row.id === memberId)?.disabled
    ).toBeTruthy();
  });

  it("moves someone into the admin's household, never the admin themself", async () => {
    const memberId = await userIdOf(db, member.householdId);
    const adminId = await userIdOf(db, admin.householdId);

    const moved = await send(
      env,
      "POST",
      `/admin/users/${memberId}/move-to-my-household`,
      { cookie: admin.cookie }
    );

    expect(moved.status).toBe(200);
    const [row] = await db.select().from(users).where(eq(users.id, memberId));
    expect(row?.householdId).toBe(admin.householdId);

    const self = await send(env, "PATCH", `/admin/users/${adminId}`, {
      body: { disabled: true },
      cookie: admin.cookie,
    });

    expect(self.status).toBe(400);
  });
});
