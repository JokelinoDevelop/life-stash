import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { BackLink } from "@/components/app/back-link";
import { PageHeader } from "@/components/app/page-header";
import { ItemsSection } from "@/modules/garage/catalog/items-section";
import { PackagesSection } from "@/modules/garage/catalog/packages-section";

const CatalogPage = () => {
  const { t } = useTranslation("garageCatalog");

  return (
    <>
      <PageHeader
        back={<BackLink to="/garage" />}
        description={t("description")}
        title={t("title")}
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <PackagesSection />
        <ItemsSection />
      </div>
    </>
  );
};

export const Route = createFileRoute("/_app/garage/catalog")({
  component: CatalogPage,
});
