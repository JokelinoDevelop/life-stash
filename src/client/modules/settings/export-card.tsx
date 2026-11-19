import { Download } from "lucide-react";
import { useTranslation } from "react-i18next";

import { buttonVariants } from "@/components/ui/button";

import { SettingsSection } from "./settings-section";

const DATASETS = [
  "service-history",
  "mileage",
  "expenses",
  "reminders",
] as const;

export const ExportCard = () => {
  const { t } = useTranslation("settings");

  return (
    <SettingsSection
      title={t("export.title")}
      description={t("export.description")}
    >
      <div className="flex flex-wrap gap-2">
        <a
          className={buttonVariants({ size: "compact" })}
          download
          href="/api/settings/export/json"
        >
          <Download />
          {t("export.json")}
        </a>
        {DATASETS.map((dataset) => (
          <a
            className={buttonVariants({ size: "compact", variant: "outline" })}
            download
            href={`/api/settings/export/csv/${dataset}`}
            key={dataset}
          >
            <Download />
            {t(`export.datasets.${dataset}`)}
          </a>
        ))}
      </div>
    </SettingsSection>
  );
};
