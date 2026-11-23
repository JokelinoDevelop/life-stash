import { z } from "zod";

import { emailField, newPasswordField, requiredText } from "@/lib/form-schemas";

export const acceptInviteFormSchema = z
  .object({
    confirmPassword: z.string(),
    displayName: requiredText(60),
    email: emailField,
    password: newPasswordField,
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "validation.passwordMatch",
    path: ["confirmPassword"],
  });

export type AcceptInviteFormValues = z.infer<typeof acceptInviteFormSchema>;
