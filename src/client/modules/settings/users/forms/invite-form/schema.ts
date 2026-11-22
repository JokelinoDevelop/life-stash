import { z } from "zod";

import { optionalText } from "@/lib/form-schemas";

export const INVITE_HOUSEHOLDS = ["own", "mine"] as const;

export const inviteFormSchema = z.object({
  household: z.enum(INVITE_HOUSEHOLDS),
  name: optionalText(60),
});

export type InviteFormValues = z.infer<typeof inviteFormSchema>;
