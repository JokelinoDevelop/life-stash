import { Download } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";

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
        <Button asChild size="compact">
          <a download href="/api/settings/export/json">
            <Download />
            {t("export.json")}
          </a>
        </Button>
        {DATASETS.map((dataset) => (
          <Button asChild key={dataset} size="compact" variant="outline">
            <a download href={`/api/settings/export/csv/${dataset}`}>
              <Download />
              {t(`export.datasets.${dataset}`)}
            </a>
          </Button>
        ))}
      </div>
    </SettingsSection>
  );
};
