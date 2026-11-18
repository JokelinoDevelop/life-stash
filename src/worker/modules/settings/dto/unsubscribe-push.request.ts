import { z } from "zod";

export const unsubscribePushRequest = z.object({
  endpoint: z.url().max(2048),
});
