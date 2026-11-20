import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { useConfirm } from "@/components/app/confirm/confirm-context";

import { api, unwrap } from "./api";

/**
 * Asks to confirm, then ends the session, drops cached data and returns to
 * the login screen.
 */
export const useSignOut = () => {
  const { t } = useTranslation("auth");
  const confirm = useConfirm();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return async () => {
    const ok = await confirm({
      confirmLabel: t("signOut"),
      description: t("signOutDescription"),
      title: t("signOutTitle"),
    });

    if (!ok) {
      return;
    }

    await unwrap(api.auth.logout.$post());
    queryClient.clear();
    await navigate({ to: "/login" });
  };
};
