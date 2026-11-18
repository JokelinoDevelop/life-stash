import { z } from "zod";

export const recoverFormSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, "validation.required")
    .refine(
      (value) => value.replaceAll(/[^a-z0-9]/giu, "").length === 12,
      "validation.required"
    ),
});

export type RecoverFormValues = z.infer<typeof recoverFormSchema>;

export const recoverFormDefaults: RecoverFormValues = { code: "" };
