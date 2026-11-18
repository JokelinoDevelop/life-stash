import { Hono } from "hono";

import type { PublicEnv } from "../../core/app-env";
import { isPhotoStorageConfigured } from "../../core/photo-storage";
import { isPushConfigured } from "../../core/push";
import type { ConfigResponse } from "./dto/config.response";

export const configRoutes = new Hono<PublicEnv>().get("/", (c) => {
  const body: ConfigResponse = {
    photosEnabled: isPhotoStorageConfigured(c.env),
    pushPublicKey: isPushConfigured(c.env)
      ? (c.env.VAPID_PUBLIC_KEY ?? null)
      : null,
  };

  return c.json(body);
});
