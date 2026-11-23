import type { InferRequestType } from "hono/client";

import type { api } from "@/lib/api";

import type { AcceptInviteFormValues } from "./schema";

type AcceptInviteBody = InferRequestType<
  (typeof api.auth.invites)[":token"]["accept"]["$post"]
>["json"];

export const acceptInviteFormDefaults = (
  name: string | null
): AcceptInviteFormValues => ({
  confirmPassword: "",
  displayName: name ?? "",
  email: "",
  password: "",
});

export const acceptInviteFormToRequest = (
  values: AcceptInviteFormValues
): AcceptInviteBody => ({
  displayName: values.displayName.trim(),
  email: values.email.trim().toLowerCase(),
  password: values.password,
  timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
});
