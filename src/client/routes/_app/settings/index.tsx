import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { SettingsSkeleton } from "@/components/app/page-skeleton";
import { configQuery, preferencesQuery } from "@/lib/session";
import { cached, warm } from "@/lib/warm";
import { fitnessSettingsQuery } from "@/modules/fitness/fitness.queries";
import { ExportCard } from "@/modules/settings/export-card";
import { NotificationsCard } from "@/modules/settings/notifications-card";
import {
  AccountSection,
  PreferencesSection,
} from "@/modules/settings/preferences-section";
import { SecurityCard } from "@/modules/settings/security-card";
import {
  credentialsQuery,
  passkeysQuery,
  pushSubscriptionQuery,
  recoveryCodesQuery,
} from "@/modules/settings/settings.queries";

const SettingsPage = () => {
  const { t } = useTranslation("settings");

  return (
    <>
      <AccountSection />
      <PreferencesSection />
      <NotificationsCard />
      <SecurityCard />
      <ExportCard />
      <p className="text-muted-foreground text-center text-xs">
        {t("about.version", {
          commit: __APP_COMMIT__,
          version: __APP_VERSION__,
        })}
      </p>
    </>
  );
};

export const Route = createFileRoute("/_app/settings/")({
  component: SettingsPage,
  pendingComponent: SettingsSkeleton,
  // Everything the rows show, so the page opens complete instead of filling in.
  loader: async ({ context: { queryClient } }) => {
    await warm(
      queryClient.query(cached(preferencesQuery)),
      queryClient.query(cached(credentialsQuery)),
      queryClient.query(cached(passkeysQuery)),
      queryClient.query(cached(recoveryCodesQuery)),
      queryClient.query(cached(fitnessSettingsQuery)),
      queryClient.query(cached(configQuery)),
      queryClient.query(cached(pushSubscriptionQuery))
    );
  },
});
