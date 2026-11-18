import { Hono } from "hono";

import type { AppEnv, PublicEnv } from "../../core/app-env";
import { requireAuth } from "../../core/middleware";
import { hashPassword } from "../../core/password";
import { createSession } from "../../core/session";
import { validate } from "../../core/validate";
import type { GetCredentialsResponse } from "./dto/get-credentials.response";
import { loginPasswordRequest } from "./dto/login-password.request";
import type { LoginPasswordResponse } from "./dto/login-password.response";
import { setupPasswordRequest } from "./dto/setup-password.request";
import type { SetupPasswordResponse } from "./dto/setup-password.response";
import { updateCredentialsRequest } from "./dto/update-credentials.request";
import type { UpdateCredentialsResponse } from "./dto/update-credentials.response";
import {
  getCredentials,
  signInWithPassword,
  updateCredentials,
} from "./password.service";
import { finishPasswordSetup } from "./setup.service";

/** Email + password sign-in, for devices without passkeys. Mounted under `/api/auth`. */
export const publicPasswordRoutes = new Hono<PublicEnv>()
  .post(
    "/setup/password",
    validate("json", setupPasswordRequest),
    async (c) => {
      const { password, ...input } = c.req.valid("json");

      const { userId, recoveryCodes } = await finishPasswordSetup(c.var.db, {
        ...input,
        passwordHash: await hashPassword(password),
      });

      await createSession(c, c.var.db, userId);
      const body: SetupPasswordResponse = { recoveryCodes };

      return c.json(body);
    }
  )
  .post(
    "/login/password",
    validate("json", loginPasswordRequest),
    async (c) => {
      const { email, password } = c.req.valid("json");
      const userId = await signInWithPassword(c.var.db, email, password);
      await createSession(c, c.var.db, userId);
      const body: LoginPasswordResponse = { ok: true };

      return c.json(body);
    }
  );

/** Managing the signed-in user's email and password. Mounted under `/api/account`. */
export const accountPasswordRoutes = new Hono<AppEnv>()
  .use(requireAuth)
  .get("/credentials", async (c) => {
    const body: GetCredentialsResponse = await getCredentials(
      c.var.db,
      c.var.auth
    );

    return c.json(body);
  })
  .put(
    "/credentials",
    validate("json", updateCredentialsRequest),
    async (c) => {
      await updateCredentials(c.var.db, c.var.auth, c.req.valid("json"));
      const body: UpdateCredentialsResponse = { ok: true };

      return c.json(body);
    }
  );
