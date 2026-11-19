import { z } from "zod";

export const listClientsQuery = z.object({
  year: z.coerce.number().int().min(1990).max(2200).optional(),
});
