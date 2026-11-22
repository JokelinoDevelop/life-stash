import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { InlineSpinner } from "@/components/app/states";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { api, unwrap } from "@/lib/api";
import { authStatusQuery } from "@/lib/session";
import { AcceptInviteForm } from "@/modules/auth/accept-invite-form/accept-invite-form";
import { AuthLayout } from "@/modules/auth/auth-layout";
import { RecoveryCodesPanel } from "@/modules/auth/recovery-codes-panel";

const InvitePage = () => {
  const { t } = useTranslation("auth");
  const { token } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [codes, setCodes] = useState<string[] | null>(null);
  const status = useQuery(authStatusQuery);

  const invite = useQuery({
    queryFn: async () =>
      await unwrap(api.auth.invites[":token"].$get({ param: { token } })),
    queryKey: ["auth", "invite", token],
    retry: false,
  });

  const signOut = async () => {
    await unwrap(api.auth.logout.$post());
    // Drops the old account's cached data and refetches what this page shows (now signed out).
    await queryClient.resetQueries();
  };

  const body = () => {
    if (codes !== null) {
      return (
        <RecoveryCodesPanel
          codes={codes}
          onDone={async () => {
            queryClient.removeQueries();
            await navigate({ to: "/" });
          }}
        />
      );
    }

    if (invite.isPending || status.isPending) {
      return (
        <div className="flex justify-center py-6">
          <InlineSpinner />
        </div>
      );
    }

    if (invite.isError) {
      return (
        <div className="flex flex-col gap-4">
          <Alert>
            <AlertDescription>{t("invite.invalid")}</AlertDescription>
          </Alert>
          <Button nativeButton={false} render={<Link to="/login" />}>
            {t("invite.toSignIn")}
          </Button>
        </div>
      );
    }

    const signedInAs = status.data?.user ?? null;

    if (signedInAs !== null) {
      return (
        <div className="flex flex-col gap-4">
          <Alert>
            <AlertDescription>
              {t("invite.signedIn", { name: signedInAs.displayName })}
            </AlertDescription>
          </Alert>
          <Button
            onClick={() => {
              void signOut();
            }}
            variant="outline"
          >
            {t("signOut")}
          </Button>
        </div>
      );
    }

    return (
      <AcceptInviteForm
        name={invite.data.name}
        onCreated={setCodes}
        token={token}
      />
    );
  };

  return (
    <AuthLayout description={t("invite.description")} title={t("invite.title")}>
      {body()}
    </AuthLayout>
  );
};

export const Route = createFileRoute("/invite/$token")({
  component: InvitePage,
});
