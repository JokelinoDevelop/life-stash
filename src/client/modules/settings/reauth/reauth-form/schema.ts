import { z } from "zod";

export const reauthFormSchema = z.object({
  password: z.string().min(1, "validation.required"),
});

export type ReauthFormValues = z.infer<typeof reauthFormSchema>;

export const reauthFormDefaults: ReauthFormValues = { password: "" };
