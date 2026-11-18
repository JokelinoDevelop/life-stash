import { z } from "zod";

export const listPhotosQuery = z.object({
  ownerId: z.uuid(),
  ownerType: z.enum(["service_visit", "expense"]),
});
