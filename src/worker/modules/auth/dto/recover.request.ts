import { z } from "zod";

export const recoverRequest = z.object({
  code: z.string().trim().min(12).max(20),
});
