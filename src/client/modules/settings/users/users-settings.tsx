import { useQuery } from "@tanstack/react-query";
import {
  Ban,
  CircleCheck,
  Home,
  MoreHorizontal,
  Plus,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { useConfirm } from "@/components/app/confirm/confirm-context";
import { ErrorState, LoadingState } from "@/components/app/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useFormat } from "@/lib/format";

import { useReauth } from "../reauth/use-reauth";
import type { Reauth } from "../reauth/use-reauth";
import { SettingsSection } from "../settings-section";
import { InviteDialog } from "./invite-dialog";
import {
  useMoveToMyHousehold,
  useRevokeInvite,
  useSetUserDisabled,
} from "./users.mutations";
import { adminInvitesQuery, adminUsersQuery } from "./users.queries";
import type { AdminUser, PendingInvite } from "./users.queries";

const rowClass =
  "flex min-h-12 items-center gap-3 px-3 py-2 text-sm md:min-h-10";

const UserMenu = ({ reauth, user }: { reauth: Reauth; user: AdminUser }) => {
  const { t } = useTranslation("settings");
  const confirm = useConfirm();
  const setDisabled = useSetUserDisabled(reauth);
  const move = useMoveToMyHousehold(reauth);

  const onMove = async () => {
    const ok = await confirm({
      confirmLabel: t("users.moveConfirm"),
      description: t("users.moveDescription"),
      title: t("users.moveTitle", { name: user.displayName }),
    });

    if (ok) {
      move.mutate(user.id);
    }
  };

  const onToggle = async () => {
    if (user.disabled) {
      setDisabled.mutate({ disabled: false, userId: user.id });

      return;
    }

    const ok = await confirm({
      confirmLabel: t("users.disable"),
      description: t("users.disableDescription"),
      title: t("users.disableTitle", { name: user.displayName }),
      tone: "destructive",
    });

    if (ok) {
      setDisabled.mutate({ disabled: true, userId: user.id });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            aria-label={t("users.moreFor", { name: user.displayName })}
            size="icon-compact"
            variant="ghost"
          />
        }
      >
        <MoreHorizontal />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {!user.inYourHousehold && (
          <DropdownMenuItem
            onClick={() => {
              void onMove();
            }}
          >
            <Home />
            {t("users.move")}
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          onClick={() => {
            void onToggle();
          }}
          variant={user.disabled ? "default" : "destructive"}
        >
          {user.disabled ? <CircleCheck /> : <Ban />}
          {user.disabled ? t("users.enable") : t("users.disable")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const UserRow = ({ reauth, user }: { reauth: Reauth; user: AdminUser }) => {
  const { t } = useTranslation("settings");

  return (
    <li className={rowClass}>
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-1.5 font-medium">
          <span className="truncate">{user.displayName}</span>
          {user.isYou && <Badge variant="secondary">{t("users.you")}</Badge>}
          {user.isAdmin && <Badge variant="outline">{t("users.admin")}</Badge>}
          {user.disabled && (
            <Badge variant="destructive">{t("users.disabled")}</Badge>
          )}
        </p>
        <p className="text-muted-foreground truncate text-xs">
          {[
            user.email,
            user.inYourHousehold
              ? t("users.yourHousehold")
              : t("users.ownHousehold"),
          ]
            .filter((part) => part !== null)
            .join(" · ")}
        </p>
      </div>
      {user.isYou ? (
        <span className="size-11 md:size-7" />
      ) : (
        <UserMenu reauth={reauth} user={user} />
      )}
    </li>
  );
};

const InviteRow = ({ invite }: { invite: PendingInvite }) => {
  const { t } = useTranslation("settings");
  const format = useFormat();
  const confirm = useConfirm();
  const revoke = useRevokeInvite();

  const onRevoke = async () => {
    const ok = await confirm({
      confirmLabel: t("users.revoke"),
      description: t("users.revokeDescription"),
      title: t("users.revokeTitle"),
      tone: "destructive",
    });

    if (ok) {
      revoke.mutate(invite.id);
    }
  };

  return (
    <li className={rowClass}>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">
          {invite.name ?? t("users.unnamedInvite")}
        </p>
        <p className="text-muted-foreground truncate text-xs">
          {invite.joinsYourHousehold
            ? t("users.joinsYourHousehold")
            : t("users.getsOwnHousehold")}
          {" · "}
          {t("users.expires", {
            date: format.date(invite.expiresAt.slice(0, 10)),
          })}
        </p>
      </div>
      <Button
        aria-label={t("users.revoke")}
        onClick={() => {
          void onRevoke();
        }}
        size="icon-compact"
        variant="ghost"
      >
        <Trash2 />
      </Button>
    </li>
  );
};

/** Settings › People (admins only): who has access, and pending invite links. */
export const UsersSettings = () => {
  const { t } = useTranslation("settings");
  const reauth = useReauth();
  const users = useQuery(adminUsersQuery);
  const invites = useQuery(adminInvitesQuery);
  const [inviting, setInviting] = useState(false);

  const usersBody = () => {
    if (users.isPending) {
      return <LoadingState rows={2} variant="rows" />;
    }

    if (users.isError) {
      return (
        <ErrorState
          className="m-3 md:m-3"
          error={users.error}
          onRetry={() => {
            void users.refetch();
          }}
        />
      );
    }

    return (
      <ul className="divide-divider divide-y">
        {users.data.users.map((user) => (
          <UserRow key={user.id} reauth={reauth} user={user} />
        ))}
      </ul>
    );
  };

  const invitesBody = () => {
    if (invites.isPending) {
      return <LoadingState rows={1} variant="rows" />;
    }

    if (invites.isError) {
      return (
        <ErrorState
          className="m-3 md:m-3"
          error={invites.error}
          onRetry={() => {
            void invites.refetch();
          }}
        />
      );
    }

    return (
      <ul className="divide-divider divide-y">
        {invites.data.invites.length === 0 && (
          <li className={`${rowClass} text-muted-foreground`}>
            {t("users.noInvites")}
          </li>
        )}
        {invites.data.invites.map((invite) => (
          <InviteRow invite={invite} key={invite.id} />
        ))}
        <li>
          <button
            className="text-primary hover:bg-background flex min-h-12 w-full items-center gap-2 px-3 text-sm font-medium transition-colors md:min-h-10"
            onClick={() => {
              setInviting(true);
            }}
            type="button"
          >
            <Plus className="size-4" />
            {t("users.invite")}
          </button>
        </li>
      </ul>
    );
  };

  return (
    <>
      {reauth.dialog}
      <InviteDialog
        onOpenChange={setInviting}
        open={inviting}
        reauth={reauth}
      />
      <SettingsSection
        description={t("users.peopleDescription")}
        flush
        title={t("users.people")}
      >
        {usersBody()}
      </SettingsSection>
      <SettingsSection
        description={t("users.invitesDescription")}
        flush
        title={t("users.invites")}
      >
        {invitesBody()}
      </SettingsSection>
    </>
  );
};
