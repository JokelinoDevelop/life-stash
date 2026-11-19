import { z } from "zod";

export const getClientParams = z.object({ clientId: z.uuid() });

export const getClientQuery = z.object({
  year: z.coerce.number().int().min(1990).max(2200).optional(),
});
