import { z } from "zod";

export const acceptInviteParams = z.object({
  token: z.string().min(20).max(100),
});

export const acceptInviteRequest = z.object({
  displayName: z.string().trim().min(1).max(60),
  email: z
    .email()
    .max(254)
    .transform((value) => value.trim().toLowerCase()),
  password: z.string().min(10).max(128),
  timeZone: z.string().min(1).max(64),
});
