import { z } from "zod";

export const deletePasskeyParams = z.object({
  passkeyId: z.string().min(1).max(1024),
});
