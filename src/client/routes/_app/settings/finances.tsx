import { createFileRoute } from "@tanstack/react-router";

import { SettingsSkeleton } from "@/components/app/page-skeleton";
import { cached, warm } from "@/lib/warm";
import { BusinessProfileSettings } from "@/modules/finances/business-profile/business-profile-settings";
import { businessProfileQuery } from "@/modules/finances/business-profile/business-profile.queries";
import { CategoriesSettings } from "@/modules/finances/categories/categories-settings";
import { categoriesQuery } from "@/modules/finances/categories/categories.queries";
import { RecurringSettings } from "@/modules/finances/recurring/recurring-settings";
import { recurringQuery } from "@/modules/finances/recurring/recurring.queries";
import { ExchangeRatesSettings } from "@/modules/finances/settings/exchange-rates-settings";
import { ExportSettings } from "@/modules/finances/settings/export-settings";
import { FinanceDefaults } from "@/modules/finances/settings/finance-defaults";
import { financeSettingsQuery } from "@/modules/finances/settings/finance-settings.queries";

const FinanceSettingsPage = () => (
  <>
    <FinanceDefaults />
    <BusinessProfileSettings />
    <ExchangeRatesSettings />
    <CategoriesSettings />
    <RecurringSettings />
    <ExportSettings />
  </>
);

export const Route = createFileRoute("/_app/settings/finances")({
  loader: async ({ context: { queryClient } }) => {
    await warm(
      queryClient.query(cached(financeSettingsQuery)),
      queryClient.query(cached(businessProfileQuery)),
      queryClient.query(cached(categoriesQuery)),
      queryClient.query(cached(recurringQuery))
    );
  },
  component: FinanceSettingsPage,
  pendingComponent: SettingsSkeleton,
});
