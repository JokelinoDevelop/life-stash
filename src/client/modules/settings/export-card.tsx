import { Download } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const DATASETS = [
  "service-history",
  "mileage",
  "expenses",
  "reminders",
] as const;

export const ExportCard = () => {
  const { t } = useTranslation("settings");

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("export.title")}</CardTitle>
        <CardDescription>{t("export.description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <a download href="/api/settings/export/json">
              <Download />
              {t("export.json")}
            </a>
          </Button>
          {DATASETS.map((dataset) => (
            <Button asChild key={dataset} variant="outline">
              <a download href={`/api/settings/export/csv/${dataset}`}>
                <Download />
                {t(`export.datasets.${dataset}`)}
              </a>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
