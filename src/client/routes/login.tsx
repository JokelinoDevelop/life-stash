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
import { Separator } from "@/components/ui/separator";
import { signInWithPasskey } from "@/lib/passkeys";
import { queryKeys } from "@/lib/query-keys";
import { authStatusQuery } from "@/lib/session";
import { AuthLayout } from "@/modules/auth/auth-layout";
import { PasswordLoginForm } from "@/modules/auth/password-login-form/password-login-form";
import { usePasskeyErrorMessage } from "@/modules/auth/use-passkey-error";

const LoginPage = () => {
  const { t } = useTranslation("auth");
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const errorMessage = usePasskeyErrorMessage();
  const { redirect: redirectTo } = Route.useSearch();
  const [busy, setBusy] = useState(false);

  const afterSignIn = async () => {
    queryClient.removeQueries();
    await queryClient.invalidateQueries({ queryKey: queryKeys.authStatus });
    await navigate({ to: safeRedirect(redirectTo) });
  };

  const signInPasskey = async () => {
    setBusy(true);

    try {
      await signInWithPasskey();
    } catch (error) {
      setBusy(false);
      toast.error(errorMessage(error));

      return;
    }

    setBusy(false);
    await afterSignIn();
  };

  return (
    <AuthLayout description={t("login.description")} title={t("login.title")}>
      <div className="flex flex-col gap-4">
        <PasswordLoginForm onSignedIn={afterSignIn} />
        <div className="text-muted-foreground flex items-center gap-3 text-xs">
          <Separator className="flex-1" />
          {t("login.or")}
          <Separator className="flex-1" />
        </div>
        <Button
          disabled={busy}
          onClick={signInPasskey}
          size="block"
          variant="outline"
        >
          {busy ? <Loader2 className="animate-spin" /> : <Fingerprint />}
          {busy ? t("login.working") : t("login.passkey")}
        </Button>
        <Button
          variant="link"
          render={<Link to="/recover" />}
          nativeButton={false}
        >
          {t("login.useRecovery")}
        </Button>
      </div>
    </AuthLayout>
  );
};

/** Only a path inside the app: never `//host` or `/\\host`, which browsers treat as another site. */
const safeRedirect = (target: string | undefined): string =>
  target !== undefined && /^\/(?![/\\])/u.test(target) ? target : "/";

export const Route = createFileRoute("/login")({
  validateSearch: z.object({ redirect: z.string().optional() }),
  beforeLoad: async ({ context }) => {
    const status = await context.queryClient.query(authStatusQuery);

    if (status.setupRequired) {
      throw redirect({ to: "/setup" });
    }

    if (status.user !== null) {
      throw redirect({ to: "/" });
    }
  },
  component: LoginPage,
});
