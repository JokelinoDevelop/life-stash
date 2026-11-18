import { useQueryClient } from "@tanstack/react-query";
import {
  createFileRoute,
  Link,
  redirect,
  useNavigate,
} from "@tanstack/react-router";
import { Fingerprint, Loader2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { signInWithPasskey } from "@/lib/passkeys";
import { queryKeys } from "@/lib/query-keys";
import { authStatusQuery } from "@/lib/session";
import { AuthLayout } from "@/modules/auth/auth-layout";
import { usePasskeyErrorMessage } from "@/modules/auth/use-passkey-error";

const LoginPage = () => {
  const { t } = useTranslation("auth");
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const errorMessage = usePasskeyErrorMessage();
  const { redirect: redirectTo } = Route.useSearch();
  const [busy, setBusy] = useState(false);

  const signIn = async () => {
    setBusy(true);

    try {
      await signInWithPasskey();
    } catch (error) {
      setBusy(false);
      toast.error(errorMessage(error));

      return;
    }

    setBusy(false);
    queryClient.removeQueries();
    await queryClient.invalidateQueries({ queryKey: queryKeys.authStatus });
    await navigate({
      to: redirectTo?.startsWith("/") === true ? redirectTo : "/garage",
    });
  };

  return (
    <AuthLayout description={t("login.description")} title={t("login.title")}>
      <div className="flex flex-col gap-4">
        <Button disabled={busy} onClick={signIn} size="lg">
          {busy ? <Loader2 className="animate-spin" /> : <Fingerprint />}
          {busy ? t("login.working") : t("login.submit")}
        </Button>
        <Button asChild variant="link">
          <Link to="/recover">{t("login.useRecovery")}</Link>
        </Button>
      </div>
    </AuthLayout>
  );
};

export const Route = createFileRoute("/login")({
  validateSearch: z.object({ redirect: z.string().optional() }),
  beforeLoad: async ({ context }) => {
    const status = await context.queryClient.query(authStatusQuery);

    if (status.setupRequired) {
      throw redirect({ to: "/setup" });
    }

    if (status.user !== null) {
      throw redirect({ to: "/garage" });
    }
  },
  component: LoginPage,
});
