import { z } from "zod";

export const subscribePushRequest = z.object({
  endpoint: z.url().max(2048),
  keys: z.object({
    auth: z.string().min(1).max(256),
    p256dh: z.string().min(1).max(256),
  }),
});
