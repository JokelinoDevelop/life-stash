import { and, eq, ne } from "drizzle-orm";
import { Hono } from "hono";

import type { AppEnv, PublicEnv } from "../../core/app-env";
import { badRequest, notFound, unauthorized } from "../../core/errors";
import { requireAuth } from "../../core/middleware";
import {
  createSession,
  destroySession,
  endOtherSessions,
  readSession,
} from "../../core/session";
import { validate } from "../../core/validate";
import { passkeys, users } from "../../db/schema/core";
import { consumeChallenge, storeChallenge } from "./challenges";
import type { AddPasskeyOptionsResponse } from "./dto/add-passkey-options.response";
import { addPasskeyVerifyRequest } from "./dto/add-passkey-verify.request";
import type { AddPasskeyVerifyResponse } from "./dto/add-passkey-verify.response";
import { deletePasskeyParams } from "./dto/delete-passkey.request";
import type { DeletePasskeyResponse } from "./dto/delete-passkey.response";
import { toPasskeyDto } from "./dto/list-passkeys.response";
import type { ListPasskeysResponse } from "./dto/list-passkeys.response";
import type { LoginOptionsResponse } from "./dto/login-options.response";
import { loginVerifyRequest } from "./dto/login-verify.request";
import type { LoginVerifyResponse } from "./dto/login-verify.response";
import type { LogoutResponse } from "./dto/logout.response";
import { recoverRequest } from "./dto/recover.request";
import type { RecoverResponse } from "./dto/recover.response";
import type { RecoveryCodesStatusResponse } from "./dto/recovery-codes-status.response";
import type { RegenerateRecoveryCodesResponse } from "./dto/regenerate-recovery-codes.response";
import { setupOptionsRequest } from "./dto/setup-options.request";
import type { SetupOptionsResponse } from "./dto/setup-options.response";
import { setupVerifyRequest } from "./dto/setup-verify.request";
import type { SetupVerifyResponse } from "./dto/setup-verify.response";
import type { StatusResponse } from "./dto/status.response";
import {
  authenticationOptions,
  passkeyRow,
  registrationOptions,
  verifyAuthentication,
  verifyRegistration,
} from "./passkeys.service";
import { requireRecentSignIn } from "./password.service";
import {
  countRemainingCodes,
  issueRecoveryCodes,
  redeemRecoveryCode,
} from "./recovery";
import { relyingPartyFor } from "./relying-party";
import { finishSetup, isSetupRequired, startSetup } from "./setup.service";

/** Endpoints that work without a session. */
export const publicAuthRoutes = new Hono<PublicEnv>()
  .get("/status", async (c) => {
    const session = await readSession(c, c.var.db);

    const [user] = session
      ? await c.var.db
          .select({ displayName: users.displayName, id: users.id })
          .from(users)
          .where(eq(users.id, session.userId))
      : [];

    const body: StatusResponse = {
      setupRequired: await isSetupRequired(c.var.db),
      user: user ?? null,
    };

    return c.json(body);
  })
  .post("/setup/options", validate("json", setupOptionsRequest), async (c) => {
    const { displayName } = c.req.valid("json");

    const body: SetupOptionsResponse = await startSetup(
      c.var.db,
      relyingPartyFor(c.req.url),
      displayName
    );

    return c.json(body);
  })
  .post("/setup/verify", validate("json", setupVerifyRequest), async (c) => {
    const { userId, recoveryCodes } = await finishSetup(
      c.var.db,
      relyingPartyFor(c.req.url),
      c.req.valid("json")
    );

    await createSession(c, c.var.db, userId);
    const body: SetupVerifyResponse = { recoveryCodes };

    return c.json(body);
  })
  .post("/login/options", async (c) => {
    const options = await authenticationOptions(relyingPartyFor(c.req.url));

    const challengeId = await storeChallenge(c.var.db, {
      challenge: options.challenge,
      purpose: "login",
    });

    const body: LoginOptionsResponse = { challengeId, options };

    return c.json(body);
  })
  .post("/login/verify", validate("json", loginVerifyRequest), async (c) => {
    const { challengeId, response } = c.req.valid("json");
    const stored = await consumeChallenge(c.var.db, challengeId, "login");

    const userId = await verifyAuthentication(
      c.var.db,
      relyingPartyFor(c.req.url),
      response,
      stored.challenge
    );

    await createSession(c, c.var.db, userId);
    const body: LoginVerifyResponse = { ok: true };

    return c.json(body);
  })
  .post("/recover", validate("json", recoverRequest), async (c) => {
    const userId = await redeemRecoveryCode(c.var.db, c.req.valid("json").code);

    if (userId === null) {
      throw unauthorized();
    }

    await createSession(c, c.var.db, userId);

    const body: RecoverResponse = {
      ok: true,
      remainingCodes: await countRemainingCodes(c.var.db, userId),
    };

    return c.json(body);
  })
  .post("/logout", async (c) => {
    await destroySession(c, c.var.db);
    const body: LogoutResponse = { ok: true };

    return c.json(body);
  });

/** Endpoints for managing the signed-in user's credentials. */
export const accountRoutes = new Hono<AppEnv>()
  .use(requireAuth)
  .get("/passkeys", async (c) => {
    const rows = await c.var.db
      .select()
      .from(passkeys)
      .where(eq(passkeys.userId, c.var.auth.userId));

    const body: ListPasskeysResponse = { passkeys: rows.map(toPasskeyDto) };

    return c.json(body);
  })
  .post("/passkeys/options", async (c) => {
    requireRecentSignIn(c.var.auth);
    const { userId } = c.var.auth;

    const [[user], existing] = await Promise.all([
      c.var.db.select().from(users).where(eq(users.id, userId)),
      c.var.db
        .select({ id: passkeys.id })
        .from(passkeys)
        .where(eq(passkeys.userId, userId)),
    ]);

    const options = await registrationOptions(
      relyingPartyFor(c.req.url),
      { id: userId, name: user?.displayName ?? "LifeStash" },
      existing.map((row) => row.id)
    );

    const challengeId = await storeChallenge(c.var.db, {
      challenge: options.challenge,
      purpose: "add-passkey",
      userId,
    });

    const body: AddPasskeyOptionsResponse = { challengeId, options };

    return c.json(body);
  })
  .post(
    "/passkeys/verify",
    validate("json", addPasskeyVerifyRequest),
    async (c) => {
      requireRecentSignIn(c.var.auth);
      const input = c.req.valid("json");
      const { userId } = c.var.auth;

      const stored = await consumeChallenge(
        c.var.db,
        input.challengeId,
        "add-passkey"
      );

      if (stored.userId !== userId) {
        throw badRequest();
      }

      const credential = await verifyRegistration(
        relyingPartyFor(c.req.url),
        input.response,
        stored.challenge
      );

      const [row] = await c.var.db
        .insert(passkeys)
        .values(
          passkeyRow(credential, { deviceName: input.deviceName, userId })
        )
        .returning();

      if (!row) {
        throw badRequest();
      }

      const body: AddPasskeyVerifyResponse = { passkey: toPasskeyDto(row) };

      return c.json(body);
    }
  )
  .delete(
    "/passkeys/:passkeyId",
    validate("param", deletePasskeyParams),
    async (c) => {
      requireRecentSignIn(c.var.auth);
      const { passkeyId } = c.req.valid("param");
      const { userId } = c.var.auth;

      const [others, [user]] = await Promise.all([
        c.var.db
          .select({ id: passkeys.id })
          .from(passkeys)
          .where(and(eq(passkeys.userId, userId), ne(passkeys.id, passkeyId))),
        c.var.db
          .select({ passwordHash: users.passwordHash })
          .from(users)
          .where(eq(users.id, userId)),
      ]);

      if (others.length === 0 && (user?.passwordHash ?? null) === null) {
        throw badRequest("Set a password before removing your last passkey");
      }

      const deleted = await c.var.db
        .delete(passkeys)
        .where(and(eq(passkeys.id, passkeyId), eq(passkeys.userId, userId)))
        .returning({ id: passkeys.id });

      if (deleted.length === 0) {
        throw notFound();
      }

      // A removed passkey may be how someone else got in: sign out everywhere else.
      await endOtherSessions(c.var.db, c.var.auth);

      const body: DeletePasskeyResponse = { ok: true };

      return c.json(body);
    }
  )
  .get("/recovery-codes", async (c) => {
    const body: RecoveryCodesStatusResponse = {
      remaining: await countRemainingCodes(c.var.db, c.var.auth.userId),
    };

    return c.json(body);
  })
  .post("/recovery-codes", async (c) => {
    requireRecentSignIn(c.var.auth);

    const body: RegenerateRecoveryCodesResponse = {
      recoveryCodes: await issueRecoveryCodes(c.var.db, c.var.auth.userId),
    };

    await endOtherSessions(c.var.db, c.var.auth);

    return c.json(body);
  });
