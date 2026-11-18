import { z } from "zod";

export const updateCredentialsRequest = z.object({
  currentPassword: z.string().max(128).nullable(),
  email: z
    .email()
    .max(254)
    .transform((value) => value.trim().toLowerCase()),
  newPassword: z.string().min(10).max(128).nullable(),
});
