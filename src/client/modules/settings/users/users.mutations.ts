import type { InferRequestType } from "hono/client";
import { useTranslation } from "react-i18next";

import { api, unwrap } from "@/lib/api";
import { useAppMutation } from "@/lib/mutation";
import { queryKeys } from "@/lib/query-keys";

import { ReauthCancelledError } from "../reauth/use-reauth";
import type { Reauth } from "../reauth/use-reauth";

type CreateInviteBody = InferRequestType<
  typeof api.admin.invites.$post
>["json"];

/** Closing "Confirm it's you" drops the action quietly. */
const quietWhenCancelled = (error: Error) =>
  error instanceof ReauthCancelledError;

export const useCreateInvite = (reauth: Reauth) =>
  useAppMutation({
    invalidate: [queryKeys.adminInvites],
    mutationFn: async (json: CreateInviteBody) =>
      await reauth.run(
        async () => await unwrap(api.admin.invites.$post({ json }))
      ),
    onError: quietWhenCancelled,
    success: false,
  });

export const useRevokeInvite = () => {
  const { t } = useTranslation("settings");

  return useAppMutation({
    invalidate: [queryKeys.adminInvites],
    mutationFn: async (inviteId: string) =>
      await unwrap(
        api.admin.invites[":inviteId"].$delete({ param: { inviteId } })
      ),
    success: t("users.inviteRevoked"),
  });
};

export const useSetUserDisabled = (reauth: Reauth) => {
  const { t } = useTranslation("settings");

  return useAppMutation({
    invalidate: [queryKeys.adminUsers],
    mutationFn: async ({
      disabled,
      userId,
    }: {
      userId: string;
      disabled: boolean;
    }) =>
      await reauth.run(
        async () =>
          await unwrap(
            api.admin.users[":userId"].$patch({
              json: { disabled },
              param: { userId },
            })
          )
      ),
    onError: quietWhenCancelled,
    successFor: (_data, { disabled }) =>
      disabled ? t("users.disabledToast") : t("users.enabledToast"),
    success: false,
  });
};

export const useMoveToMyHousehold = (reauth: Reauth) => {
  const { t } = useTranslation("settings");

  return useAppMutation({
    invalidate: [queryKeys.adminUsers],
    mutationFn: async (userId: string) =>
      await reauth.run(
        async () =>
          await unwrap(
            api.admin.users[":userId"]["move-to-my-household"].$post({
              param: { userId },
            })
          )
      ),
    onError: quietWhenCancelled,
    success: t("users.movedToast"),
  });
};
