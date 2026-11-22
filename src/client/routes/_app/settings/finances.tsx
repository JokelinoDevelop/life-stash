import { createFileRoute } from "@tanstack/react-router";

import { PageContent } from "@/components/app/page-header";
import { BusinessProfileSettings } from "@/modules/finances/business-profile/business-profile-settings";
import { CategoriesSettings } from "@/modules/finances/categories/categories-settings";
import { RecurringSettings } from "@/modules/finances/recurring/recurring-settings";
import { ExchangeRatesSettings } from "@/modules/finances/settings/exchange-rates-settings";
import { ExportSettings } from "@/modules/finances/settings/export-settings";
import { FinanceDefaults } from "@/modules/finances/settings/finance-defaults";

const FinanceSettingsPage = () => (
  <PageContent>
    <div className="flex flex-col gap-6">
      <FinanceDefaults />
      <BusinessProfileSettings />
      <ExchangeRatesSettings />
      <CategoriesSettings />
      <RecurringSettings />
      <ExportSettings />
    </div>
  </PageContent>
);

export const Route = createFileRoute("/_app/settings/finances")({
  component: FinanceSettingsPage,
});
