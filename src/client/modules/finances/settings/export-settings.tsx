import { Download } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { todayIso } from "@/lib/partial-date";
import { SettingsSection } from "@/modules/settings/settings-section";

import { exportUrl } from "./export-url";

const YEARS_BACK = 5;

/** Settings › Finances › Export: a CSV per year (4.1). */
export const ExportSettings = () => {
  const { t } = useTranslation("finances");
  const current = Number(todayIso().slice(0, 4));
  const [year, setYear] = useState(current);

  const years = Array.from(
    { length: YEARS_BACK + 1 },
    (_, index) => current - index
  );

  return (
    <SettingsSection
      description={t("export.description")}
      flush
      title={t("export.title")}
    >
      <div className="divide-divider divide-y">
        <div className="flex min-h-12 items-center justify-between gap-4 px-3 md:min-h-11">
          <span className="text-sm">{t("export.year")}</span>
          <Select
            onValueChange={(value) => {
              setYear(Number(value));
            }}
            value={String(year)}
          >
            <SelectTrigger aria-label={t("export.year")} size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((option) => (
                <SelectItem key={option} value={String(option)}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {(["transactions", "invoices"] as const).map((type) => (
          <div
            className="flex min-h-12 items-center justify-between gap-4 px-3 md:min-h-11"
            key={type}
          >
            <span className="text-sm">{t(`export.${type}`, { year })}</span>
            <Button asChild size="compact" variant="outline">
              <a download href={exportUrl(type, year)}>
                <Download />
                {t("export.download")}
              </a>
            </Button>
          </div>
        ))}
      </div>
    </SettingsSection>
  );
};
