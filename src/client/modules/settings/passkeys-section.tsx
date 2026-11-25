import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { KeyRound, Plus, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/app/confirm-dialog";
import { Button } from "@/components/ui/button";
import { api, unwrap } from "@/lib/api";
import { useFormat } from "@/lib/format";
import { addPasskey } from "@/lib/passkeys";
import { queryKeys } from "@/lib/query-keys";
import { usePasskeyErrorMessage } from "@/modules/auth/use-passkey-error";

import { ReauthCancelledError, useReauth } from "./reauth/use-reauth";
import { credentialsQuery, passkeysQuery } from "./settings.queries";

/** Sheet content: your passkeys (remove) and Add passkey. */
export const PasskeysSection = () => {
  const { t } = useTranslation("settings");
  const queryClient = useQueryClient();
  const format = useFormat();
  const errorMessage = usePasskeyErrorMessage();
  const reauth = useReauth();

  const passkeys = useQuery(passkeysQuery);
  const credentials = useQuery(credentialsQuery);

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.passkeys });
    await queryClient.invalidateQueries({ queryKey: queryKeys.credentials });
  };

  const add = useMutation({
    mutationFn: async () => {
      await reauth.run(addPasskey);
    },
    onError: (error) => {
      if (!(error instanceof ReauthCancelledError)) {
        toast.error(errorMessage(error));
      }
    },
    onSuccess: async () => {
      toast.success(t("security.added"));
      await refresh();
    },
  });

  const remove = async (passkeyId: string) => {
    try {
      await reauth.run(
        async () =>
          await unwrap(
            api.account.passkeys[":passkeyId"].$delete({ param: { passkeyId } })
          )
      );
      toast.success(t("security.removed"));
      await refresh();
    } catch (error) {
      if (!(error instanceof ReauthCancelledError)) {
        toast.error(errorMessage(error));
      }

      throw error;
    }
  };

  const list = passkeys.data?.passkeys ?? [];

  return (
    <div className="flex flex-col gap-3">
      {reauth.dialog}
      <p className="text-muted-foreground text-sm">
        {t("security.passkeysHelp")}
      </p>
      {list.length > 0 && (
        <ul className="divide-divider flex flex-col divide-y rounded-lg border">
          {list.map((passkey) => (
            <li className="flex items-center gap-3 p-3" key={passkey.id}>
              <KeyRound className="text-muted-foreground size-4 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {passkey.deviceName}
                </p>
                <p className="text-muted-foreground text-xs">
                  {passkey.lastUsedAt === null
                    ? t("security.neverUsed")
                    : t("security.lastUsed", {
                        date: format.date(passkey.lastUsedAt.slice(0, 10)),
                      })}
                </p>
              </div>
              {(list.length > 1 || credentials.data?.hasPassword === true) && (
                <ConfirmDialog
                  onConfirm={async () => {
                    await remove(passkey.id);
                  }}
                  trigger={
                    <Button
                      aria-label={t("security.removed")}
                      size="icon"
                      variant="ghost"
                    >
                      <Trash2 />
                    </Button>
                  }
                />
              )}
            </li>
          ))}
        </ul>
      )}
      <Button
        className="w-full md:w-auto md:self-start"
        disabled={add.isPending}
        onClick={() => {
          add.mutate();
        }}
        variant="outline"
      >
        <Plus />
        {t("security.addPasskey")}
      </Button>
    </div>
  );
};
