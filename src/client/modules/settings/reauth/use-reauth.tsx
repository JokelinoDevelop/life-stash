import { useQuery, useQueryClient } from "@tanstack/react-query";
import { KeyRound } from "lucide-react";
import { useRef, useState } from "react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { api, ApiClientError, unwrap } from "@/lib/api";
import { PasskeyError, signInWithPasskey } from "@/lib/passkeys";
import { queryKeys } from "@/lib/query-keys";
import { usePasskeyErrorMessage } from "@/modules/auth/use-passkey-error";

import { ReauthForm } from "./reauth-form/reauth-form";

/** Thrown when you close "Confirm it's you": the action is dropped, with no error shown. */
export class ReauthCancelledError extends Error {
  override readonly name = "ReauthCancelledError";
}

interface Pending {
  resolve: () => void;
  reject: (error: Error) => void;
}

export interface Reauth {
  /** Runs the action; asks you to confirm it's you and runs it again when the server wants. */
  run: <T>(action: () => Promise<T>) => Promise<T>;
  /** The "Confirm it's you" dialog; render it next to the actions. */
  dialog: ReactNode;
}

/**
 * Runs a sensitive action (recovery codes, passkeys). When the server wants a recent sign-in,
 * asks you to confirm it's you (passkey, or password) and runs it again.
 */
export const useReauth = (): Reauth => {
  const { t } = useTranslation("settings");
  const queryClient = useQueryClient();
  const passkeyError = usePasskeyErrorMessage();
  const [open, setOpen] = useState(false);
  const pending = useRef<Pending | null>(null);

  const credentials = useQuery({
    queryFn: async () => await unwrap(api.account.credentials.$get()),
    queryKey: queryKeys.credentials,
  });

  const settle = (outcome: "confirmed" | "cancelled") => {
    const waiting = pending.current;
    pending.current = null;
    setOpen(false);

    if (outcome === "confirmed") {
      waiting?.resolve();
    } else {
      waiting?.reject(new ReauthCancelledError());
    }
  };

  const confirmed = async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.credentials });
    settle("confirmed");
  };

  const run = async <T,>(action: () => Promise<T>): Promise<T> => {
    try {
      return await action();
    } catch (error) {
      if (
        !(error instanceof ApiClientError && error.code === "reauth_required")
      ) {
        throw error;
      }

      // oxlint-disable-next-line promise/avoid-new -- waits for your answer in the dialog
      await new Promise<void>((resolve, reject) => {
        pending.current = { reject, resolve };
        setOpen(true);
      });

      return await action();
    }
  };

  const confirmWithPasskey = async () => {
    try {
      await signInWithPasskey();
    } catch (error) {
      if (!(error instanceof PasskeyError && error.reason === "cancelled")) {
        toast.error(passkeyError(error));
      }

      return;
    }

    await confirmed();
  };

  const email = credentials.data?.email ?? null;
  const hasPasskey = (credentials.data?.passkeyCount ?? 0) > 0;
  const hasPassword = credentials.data?.hasPassword === true && email !== null;

  const dialog = (
    <Dialog
      onOpenChange={(next) => {
        if (!next) {
          settle("cancelled");
        }
      }}
      open={open}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("security.reauthTitle")}</DialogTitle>
          <DialogDescription>
            {t("security.reauthDescription")}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          {hasPasskey && (
            <Button
              onClick={() => {
                void confirmWithPasskey();
              }}
              type="button"
            >
              <KeyRound />
              {t("security.reauthPasskey")}
            </Button>
          )}
          {hasPasskey && hasPassword && (
            <p className="text-muted-foreground text-center text-sm">
              {t("security.reauthOr")}
            </p>
          )}
          {hasPassword && <ReauthForm email={email} onConfirmed={confirmed} />}
        </div>
      </DialogContent>
    </Dialog>
  );

  return { dialog, run };
};
