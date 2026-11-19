import { Hono } from "hono";
import { csrf } from "hono/csrf";
import { secureHeaders } from "hono/secure-headers";

import type { AppEnv, PublicEnv } from "./core/app-env";
import { handleError } from "./core/errors";
import { requireAuth, withDb } from "./core/middleware";
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
  // Rejects cross-site form submissions (state-changing requests must come from our own origin).
  .use(csrf())
  .use(withDb)
  .route("/auth", publicAuthRoutes)
  .route("/auth", publicPasswordRoutes)
  .route("/account", accountRoutes)
  .route("/account", accountPasswordRoutes)
  .route("/config", configRoutes)
  .route("/", privateRoutes);

app.onError(handleError);

app.notFound((c) =>
  c.json({ error: { code: "not_found", message: "Not found" } }, 404)
);

export type AppType = typeof app;
