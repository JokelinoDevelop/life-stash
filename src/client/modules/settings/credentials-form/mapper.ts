import type { InferRequestType } from "hono/client";

import type { api, SuccessBody } from "@/lib/api";

import type { CredentialsFormValues } from "./schema";

type Credentials = SuccessBody<
  Awaited<ReturnType<typeof api.account.credentials.$get>>
>;

type UpdateCredentialsBody = InferRequestType<
  typeof api.account.credentials.$put
>["json"];

export const credentialsToFormValues = (
  credentials: Credentials
): CredentialsFormValues => ({
  confirmPassword: "",
  currentPassword: "",
  email: credentials.email ?? "",
  newPassword: "",
});

export const credentialsFormToRequest = (
  values: CredentialsFormValues
): UpdateCredentialsBody => ({
  currentPassword:
    values.currentPassword === "" ? null : values.currentPassword,
  email: values.email.trim().toLowerCase(),
  newPassword: values.newPassword === "" ? null : values.newPassword,
});
