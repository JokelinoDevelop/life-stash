import { distancePerYear } from "@shared/domain/mileage";
import type { OdometerPoint } from "@shared/domain/mileage";
import { distancePerMonth } from "@shared/domain/mileage-buckets";
import { kmToDisplay } from "@shared/domain/units";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
// Recharts is only reached through React.lazy (see mileage-tab.tsx), so it is code-split.
// oxlint-disable-next-line react-doctor/prefer-dynamic-import
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";

import { Panel } from "@/components/app/list-section";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { ChartConfig } from "@/components/ui/chart";
import { useFormat } from "@/lib/format";

interface ChartRow {
  label: string;
  distance: number;
}

const DistanceChart = ({
  title,
  rows,
}: {
  title: string;
  rows: ChartRow[];
}) => {
  const { t } = useTranslation("garageMileage");

  const config: ChartConfig = {
    distance: { color: "var(--chart-1)", label: t("charts.distance") },
  };

  return (
    <Panel title={title}>
      <ChartContainer className="aspect-auto h-52 w-full" config={config}>
        <BarChart accessibilityLayer data={rows}>
          <CartesianGrid vertical={false} />
          <XAxis
            axisLine={false}
            dataKey="label"
            tickLine={false}
            tickMargin={8}
          />
          <ChartTooltip content={<ChartTooltipContent />} cursor={false} />
          <Bar
            dataKey="distance"
            fill="var(--color-distance)"
            radius={[3, 3, 0, 0]}
          />
        </BarChart>
      </ChartContainer>
    </Panel>
  );
};

export const MileageCharts = ({
  points,
  today,
}: {
  points: OdometerPoint[];
  today: string;
}) => {
  const { t, i18n } = useTranslation("garageMileage");
  const { unit } = useFormat();

  const monthFormat = useMemo(
    () =>
      new Intl.DateTimeFormat(i18n.language === "mk" ? "mk-MK" : "en-GB", {
        month: "short",
        timeZone: "UTC",
      }),
    [i18n.language]
  );

  const monthly = distancePerMonth(points, today).map((entry) => ({
    distance: kmToDisplay(entry.km, unit),
    label: monthFormat.format(new Date(`${entry.month}-01T00:00:00Z`)),
  }));

  const yearly = distancePerYear(points).map((entry) => ({
    distance: kmToDisplay(entry.km, unit),
    label: String(entry.year),
  }));

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <DistanceChart rows={monthly} title={t("charts.perMonth")} />
      <DistanceChart rows={yearly} title={t("charts.perYear")} />
    </div>
  );
};
