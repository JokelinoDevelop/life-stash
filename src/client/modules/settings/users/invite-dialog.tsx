import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { FormDialog } from "@/components/app/form-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useFormat } from "@/lib/format";

import type { Reauth } from "../reauth/use-reauth";
import { InviteForm } from "./forms/invite-form/invite-form";
import {
  inviteFormDefaults,
  inviteFormToCreateRequest,
} from "./forms/invite-form/mapper";
import { useCreateInvite } from "./users.mutations";

interface CreatedInvite {
  link: string;
  expiresAt: string;
}

/** The link is shown once: only its hash is stored. */
const InviteLink = ({
  invite,
  onDone,
}: {
  invite: CreatedInvite;
  onDone: () => void;
}) => {
  const { t } = useTranslation("settings");
  const format = useFormat();
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(invite.link);
      setCopied(true);
      toast.success(t("users.linkCopied"));
    } catch {
      toast.error(t("users.copyFailed"));
    }
  };

  return (
    <div className="flex flex-col">
      <div className="flex flex-col gap-3 px-4 py-4 md:px-6 md:py-5">
        <p className="text-sm">{t("users.linkReady")}</p>
        <div className="flex gap-2">
          <Input
            aria-label={t("users.link")}
            onFocus={(event) => {
              event.currentTarget.select();
            }}
            readOnly
            value={invite.link}
          />
          <Button
            onClick={() => {
              void copy();
            }}
            type="button"
            variant="outline"
          >
            {copied ? <Check /> : <Copy />}
            {t("users.copy")}
          </Button>
        </div>
        <p className="text-muted-foreground text-xs">
          {t("users.linkHelp", {
            date: format.date(invite.expiresAt.slice(0, 10)),
          })}
        </p>
      </div>
      <div className="border-divider flex justify-end border-t px-4 py-3 md:px-6">
        <Button onClick={onDone} type="button">
          {t("users.done")}
        </Button>
      </div>
    </div>
  );
};

/** "Invite someone": you pick whether they join your household; then copy the one-time link. */
export const InviteDialog = ({
  onOpenChange,
  open,
  reauth,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reauth: Reauth;
}) => {
  const { t } = useTranslation("settings");
  const create = useCreateInvite(reauth);
  const [created, setCreated] = useState<CreatedInvite | null>(null);

  const changeOpen = (next: boolean) => {
    onOpenChange(next);

    if (!next) {
      setCreated(null);
    }
  };

  return (
    <FormDialog
      onOpenChange={changeOpen}
      open={open}
      title={t("users.inviteTitle")}
    >
      {created === null ? (
        <InviteForm
          defaultValues={inviteFormDefaults}
          onCancel={() => {
            changeOpen(false);
          }}
          onSubmit={async (values) => {
            const { expiresAt, token } = await create.mutateAsync(
              inviteFormToCreateRequest(values)
            );

            setCreated({
              expiresAt,
              link: `${window.location.origin}/invite/${token}`,
            });
          }}
        />
      ) : (
        <InviteLink
          invite={created}
          onDone={() => {
            changeOpen(false);
          }}
        />
      )}
    </FormDialog>
  );
};
