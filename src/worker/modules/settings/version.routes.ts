import { Hono } from "hono";

import type { PublicEnv } from "../../core/app-env";
import type { GetVersionResponse } from "./dto/get-version.response";

/** Public: lets the release script confirm which build is live. */
export const versionRoutes = new Hono<PublicEnv>().get("/", (c) => {
  const body: GetVersionResponse = {
    version: __APP_VERSION__,
  };

  return c.json(body);
});
