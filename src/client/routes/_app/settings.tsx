import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import { useTranslation } from "react-i18next";

import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { api, unwrap } from "@/lib/api";
import { preferencesQuery } from "@/lib/session";
import { ExportCard } from "@/modules/settings/export-card";
import { NotificationsCard } from "@/modules/settings/notifications-card";
import { PreferencesForm } from "@/modules/settings/preferences-form/preferences-form";
import { SecurityCard } from "@/modules/settings/security-card";
import { ThemeCard } from "@/modules/settings/theme-card";

const SettingsPage = () => {
  const { t } = useTranslation("settings");
  const { t: ta } = useTranslation("auth");
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { data: preferences } = useSuspenseQuery(preferencesQuery);

  return (
    <>
      <PageHeader
        actions={
          <Button
            onClick={async () => {
              await unwrap(api.auth.logout.$post());
              queryClient.clear();
              await navigate({ to: "/login" });
            }}
            variant="outline"
          >
            <LogOut />
            {ta("signOut")}
          </Button>
        }
        title={t("title")}
      />
      <div className="flex flex-col gap-4">
        <PreferencesForm
          key={JSON.stringify(preferences)}
          preferences={preferences}
        />
        <ThemeCard />
        <NotificationsCard />
        <SecurityCard />
        <ExportCard />
        <p className="text-muted-foreground text-center text-xs">
          {t("about.version", { version: __APP_VERSION__ })}
        </p>
      </div>
    </>
  );
};

export const Route = createFileRoute("/_app/settings")({
  component: SettingsPage,
  loader: async ({ context }) => {
    await context.queryClient.query(preferencesQuery);
  },
});
