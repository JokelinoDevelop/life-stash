import { z } from "zod";

export const loginPasswordRequest = z.object({
  email: z
    .string()
    .trim()
    .min(1)
    .max(254)
    .transform((value) => value.toLowerCase()),
  password: z.string().min(1).max(128),
});
