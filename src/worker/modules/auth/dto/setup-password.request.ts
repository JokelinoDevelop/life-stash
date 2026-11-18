import { z } from "zod";

export const setupPasswordRequest = z.object({
  displayName: z.string().trim().min(1).max(60),
  email: z
    .email()
    .max(254)
    .transform((value) => value.trim().toLowerCase()),
  password: z.string().min(10).max(128),
  timeZone: z.string().min(1).max(64),
});
