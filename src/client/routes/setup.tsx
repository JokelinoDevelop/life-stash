import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { queryKeys } from "@/lib/query-keys";
import { authStatusQuery } from "@/lib/session";
import { AuthLayout } from "@/modules/auth/auth-layout";
import { PasskeySetupForm } from "@/modules/auth/passkey-setup-form";
import { PasswordSetupForm } from "@/modules/auth/password-setup-form/password-setup-form";
import { RecoveryCodesPanel } from "@/modules/auth/recovery-codes-panel";

const SetupPage = () => {
  const { t } = useTranslation("auth");
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [codes, setCodes] = useState<string[] | null>(null);

  return (
    <AuthLayout description={t("setup.description")} title={t("setup.title")}>
      {codes === null ? (
        <Tabs defaultValue="password">
          <TabsList className="mb-4 w-full">
            <TabsTrigger value="password">{t("setup.usePassword")}</TabsTrigger>
            <TabsTrigger value="passkey">{t("setup.usePasskey")}</TabsTrigger>
          </TabsList>
          <TabsContent value="password">
            <PasswordSetupForm onCreated={setCodes} />
          </TabsContent>
          <TabsContent value="passkey">
            <PasskeySetupForm onCreated={setCodes} />
          </TabsContent>
        </Tabs>
      ) : (
        <RecoveryCodesPanel
          codes={codes}
          onDone={async () => {
            await queryClient.invalidateQueries({
              queryKey: queryKeys.authStatus,
            });
            await navigate({ to: "/" });
          }}
        />
      )}
    </AuthLayout>
  );
};

export const Route = createFileRoute("/setup")({
  beforeLoad: async ({ context }) => {
    const status = await context.queryClient.query(authStatusQuery);

    if (!status.setupRequired) {
      throw redirect({ to: "/login" });
    }
  },
  component: SetupPage,
});
