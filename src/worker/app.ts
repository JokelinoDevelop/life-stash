import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { csrf } from "hono/csrf";
import { secureHeaders } from "hono/secure-headers";

import type { AppEnv, PublicEnv } from "./core/app-env";
import { ApiError, handleError } from "./core/errors";
import { noStore, requireAuth, withDb } from "./core/middleware";
import { authRateLimit } from "./core/rate-limit";
import { adminController } from "./modules/admin/admin.controller";
import { publicInvitesController } from "./modules/admin/invites.controller";
import {
  accountPasswordRoutes,
  publicPasswordRoutes,
} from "./modules/auth/password.routes";
import { accountRoutes, publicAuthRoutes } from "./modules/auth/routes";
import { financesController } from "./modules/finances/finances.controller";
import { garageRoutes } from "./modules/garage/garage.routes";
import { photoRoutes } from "./modules/photos/photos.routes";
import { configRoutes } from "./modules/settings/config.routes";
import { settingsRoutes } from "./modules/settings/settings.routes";

const MAX_BODY_BYTES = 1024 * 1024;

/** Everything behind a session. */
const privateRoutes = new Hono<AppEnv>()
  .use(requireAuth)
  .route("/garage", garageRoutes)
  .route("/finances", financesController)
  .route("/photos", photoRoutes)
  .route("/settings", settingsRoutes);

export const app = new Hono<PublicEnv>()
  .basePath("/api")
  .use(secureHeaders())
  // Private data: never kept by the browser cache or a shared proxy.
  .use(noStore)
  // Rejects cross-site form submissions (state-changing requests must come from our own origin).
  .use(csrf())
  // Requests are small JSON (files go straight to storage); refuse anything large.
  .use(
    bodyLimit({
      maxSize: MAX_BODY_BYTES,
      onError: () => {
        throw new ApiError(413, "bad_request", "Request too large");
      },
    })
  )
  .use("/auth/*", authRateLimit)
  .use(withDb)
  .route("/auth", publicAuthRoutes)
  .route("/auth", publicPasswordRoutes)
  .route("/auth", publicInvitesController)
  .route("/admin", adminController)
  .route("/account", accountRoutes)
  .route("/account", accountPasswordRoutes)
  .route("/config", configRoutes)
  .route("/", privateRoutes);

app.onError(handleError);

app.notFound((c) =>
  c.json({ error: { code: "not_found", message: "Not found" } }, 404)
);

export type AppType = typeof app;
