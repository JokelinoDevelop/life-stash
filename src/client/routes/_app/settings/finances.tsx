import { createFileRoute } from "@tanstack/react-router";

import { PageContent } from "@/components/app/page-header";
import { CategoriesSettings } from "@/modules/finances/categories/categories-settings";

const FinanceSettingsPage = () => (
  <PageContent>
    <div className="flex flex-col gap-6">
      <CategoriesSettings />
    </div>
  </PageContent>
);

export const Route = createFileRoute("/_app/settings/finances")({
  component: FinanceSettingsPage,
});
