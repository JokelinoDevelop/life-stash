import { z } from "zod";

export const setupOptionsRequest = z.object({
  displayName: z.string().trim().min(1).max(60),
});
