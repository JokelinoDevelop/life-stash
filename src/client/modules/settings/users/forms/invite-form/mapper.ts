import type { InferRequestType } from "hono/client";

import type { api } from "@/lib/api";

import type { InviteFormValues } from "./schema";

type CreateInviteBody = InferRequestType<
  typeof api.admin.invites.$post
>["json"];

/** A new household of their own unless you say otherwise. */
export const inviteFormDefaults: InviteFormValues = {
  household: "own",
  name: "",
};

export const inviteFormToCreateRequest = (
  values: InviteFormValues
): CreateInviteBody => ({
  joinMyHousehold: values.household === "mine",
  name: values.name.trim() === "" ? null : values.name.trim(),
});
