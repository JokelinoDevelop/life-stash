import { z } from "zod";

import { emailField, MIN_PASSWORD_LENGTH } from "@/lib/form-schemas";

/**
 * `passwordRequired` is true when the account has no password yet (passkey-only), so a new one
 * must be chosen; otherwise an empty new password keeps the current one.
 */
export const credentialsFormSchema = (passwordRequired: boolean) =>
  z
    .object({
      confirmPassword: z.string(),
      currentPassword: z.string(),
      email: emailField,
      newPassword: z.string().max(128, "validation.tooLong"),
    })
    .refine(
      (values) =>
        (values.newPassword === "" && !passwordRequired) ||
        values.newPassword.length >= MIN_PASSWORD_LENGTH,
      { message: "validation.passwordLength", path: ["newPassword"] }
    )
    .refine((values) => values.newPassword === values.confirmPassword, {
      message: "validation.passwordMatch",
      path: ["confirmPassword"],
    });

export type CredentialsFormValues = z.infer<
  ReturnType<typeof credentialsFormSchema>
>;
