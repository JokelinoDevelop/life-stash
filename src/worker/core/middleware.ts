import { createMiddleware } from "hono/factory";

import type { AppEnv, PublicEnv } from "./app-env";
import { Container } from "./container";
import { createDb } from "./db";
import { ApiError, unauthorized } from "./errors";
import { readSession } from "./session";

export const noStore = createMiddleware<PublicEnv>(async (c, next) => {
  await next();
  c.header("Cache-Control", "no-store");
});

export const withDb = createMiddleware<PublicEnv>(async (c, next) => {
  c.set("db", createDb(c.env.DB));

  await next();
});

export const requireAuth = createMiddleware<AppEnv>(async (c, next) => {
  const auth = await readSession(c, c.var.db);

  if (!auth) {
    throw unauthorized();
  }

  c.set("auth", auth);
  c.set(
    "container",
    new Container({
      db: c.var.db,
      defer: (work) => {
        c.executionCtx.waitUntil(work);
      },
      env: c.env,
      householdId: auth.householdId,
      userId: auth.userId,
    })
  );

  await next();
});

/** After `requireAuth`: only admins (they invite people and manage accounts). */
export const requireAdmin = createMiddleware<AppEnv>(async (c, next) => {
  if (!c.var.auth.isAdmin) {
    throw new ApiError(403, "forbidden");
  }

  await next();
});
