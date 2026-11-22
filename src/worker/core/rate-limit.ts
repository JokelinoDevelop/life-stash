import { createMiddleware } from "hono/factory";

import type { PublicEnv } from "./app-env";
import { ApiError } from "./errors";

/**
 * Per-IP limit on sign-in attempts (password, passkey, recovery code, setup), so nobody can
 * guess passwords or codes at speed or run up database writes. Only POSTs count; skipped where
 * the binding isn't configured (tests, plain local dev).
 */
export const authRateLimit = createMiddleware<PublicEnv>(async (c, next) => {
  const limiter = c.env.AUTH_LIMITER;

  if (limiter !== undefined && c.req.method === "POST") {
    const key = c.req.header("cf-connecting-ip") ?? "unknown";
    const { success } = await limiter.limit({ key });

    if (!success) {
      throw new ApiError(
        429,
        "rate_limited",
        "Too many attempts. Try again in a minute."
      );
    }
  }

  await next();
});
