import { toMajor } from "@shared/domain/money";
import type { Currency } from "@shared/domain/money";
import { useTranslation } from "react-i18next";
// Recharts is only reached through React.lazy (see spending-tab.tsx), so it is code-split.
// oxlint-disable-next-line react-doctor/prefer-dynamic-import
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { ChartConfig } from "@/components/ui/chart";

import type { CarSpendingYear } from "./spending.queries";

export const SpendingChart = ({
  years,
  currency,
}: {
  years: CarSpendingYear[];
  currency: Currency;
}) => {
  const { t } = useTranslation("garageSpending");

  const config: ChartConfig = {
    maintenance: { color: "var(--chart-1)", label: t("columns.maintenance") },
    other: { color: "var(--chart-3)", label: t("columns.other") },
    repair: { color: "var(--chart-5)", label: t("columns.repair") },
  };

  const rows = years
    .filter((year) => year.currency === currency)
    .toSorted((a, b) => a.year - b.year)
    .map((year) => ({
      label: String(year.year),
      maintenance: toMajor(year.maintenanceMinor),
      other: toMajor(year.otherMinor),
      repair: toMajor(year.repairMinor),
    }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("chartTitle", { currency })}</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer className="aspect-auto h-60 w-full" config={config}>
          <BarChart accessibilityLayer data={rows}>
            <CartesianGrid vertical={false} />
            <XAxis
              axisLine={false}
              dataKey="label"
              tickLine={false}
              tickMargin={8}
            />
            <ChartTooltip content={<ChartTooltipContent />} cursor={false} />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar
              dataKey="maintenance"
              fill="var(--color-maintenance)"
              stackId="costs"
            />
            <Bar dataKey="repair" fill="var(--color-repair)" stackId="costs" />
            <Bar
              dataKey="other"
              fill="var(--color-other)"
              radius={[4, 4, 0, 0]}
              stackId="costs"
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};
