import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { PageContent } from "@/components/app/page-header";
import { preferencesQuery } from "@/lib/session";
import { ExportCard } from "@/modules/settings/export-card";
import { NotificationsCard } from "@/modules/settings/notifications-card";
import { PreferencesForm } from "@/modules/settings/preferences-form/preferences-form";
import { SecurityCard } from "@/modules/settings/security-card";
import { ThemeCard } from "@/modules/settings/theme-card";

const SettingsPage = () => {
  const { t } = useTranslation("settings");
  const { data: preferences } = useSuspenseQuery(preferencesQuery);

  return (
    <PageContent>
      <div className="flex flex-col gap-6">
        <PreferencesForm
          key={JSON.stringify(preferences)}
          preferences={preferences}
        />
        <ThemeCard />
        <NotificationsCard />
        <SecurityCard />
        <ExportCard />
        <p className="text-muted-foreground text-center text-xs">
          {t("about.version", {
            commit: __APP_COMMIT__,
            version: __APP_VERSION__,
          })}
        </p>
      </div>
    </PageContent>
  );
};

export const Route = createFileRoute("/_app/settings/")({
  component: SettingsPage,
  loader: async ({ context }) => {
    await context.queryClient.query(preferencesQuery);
  },
});
