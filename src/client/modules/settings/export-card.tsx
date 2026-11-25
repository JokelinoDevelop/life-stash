import { Download, FileJson, Sheet } from "lucide-react";
import { useTranslation } from "react-i18next";

import { SettingsActionRow, SettingsSection } from "./settings-section";

const DATASETS = [
  "service-history",
  "mileage",
  "expenses",
  "reminders",
] as const;

const DownloadIcon = () => (
  <Download aria-hidden="true" className="text-muted-foreground size-4" />
);

/** Backup & export: one download row each (full JSON first, then CSV tables). */
export const ExportCard = () => {
  const { t } = useTranslation("settings");

  return (
    <SettingsSection
      description={t("export.description")}
      flush
      title={t("export.title")}
    >
      <SettingsActionRow
        icon={<FileJson />}
        label={t("export.json")}
        render={(content, className) => (
          <a className={className} download href="/api/settings/export/json">
            {content}
          </a>
        )}
        trailing={<DownloadIcon />}
      />
      {DATASETS.map((dataset) => (
        <SettingsActionRow
          icon={<Sheet />}
          key={dataset}
          label={t(`export.datasets.${dataset}`)}
          render={(content, className) => (
            <a
              className={className}
              download
              href={`/api/settings/export/csv/${dataset}`}
            >
              {content}
            </a>
          )}
          trailing={<DownloadIcon />}
        />
      ))}
    </SettingsSection>
  );
};
