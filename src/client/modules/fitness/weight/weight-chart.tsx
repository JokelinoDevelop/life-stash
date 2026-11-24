import { gramsToKg } from "@shared/domain/fitness/weight";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
// Recharts is only reached through React.lazy (see weight-view.tsx), so it is code-split.
// oxlint-disable-next-line react-doctor/prefer-dynamic-import
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import type { ChartConfig } from "@/components/ui/chart";

import { localOfIso } from "../calendar/calendar-dates";
import type { WeightEntry } from "../fitness.queries";
import { useWeightFormat } from "./use-weight-format";

interface Point {
  date: string;
  label: string;
  kg: number;
}

const isPoint = (value: unknown): value is Point =>
  typeof value === "object" &&
  value !== null &&
  "kg" in value &&
  "label" in value;

/** Room above and below the line, in kg, so it never touches the edges. */
const PADDING_KG = 0.5;

const WeightTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: readonly { payload?: unknown }[];
}) => {
  const weight = useWeightFormat();
  const point = payload?.[0]?.payload;

  if (active !== true || !isPoint(point)) {
    return null;
  }

  return (
    <div className="bg-popover text-popover-foreground grid gap-0.5 rounded-md border px-2.5 py-1.5 text-xs shadow-md">
      <span className="text-muted-foreground">{point.label}</span>
      <span className="font-medium tabular-nums">
        {weight.kg(Math.round(point.kg * 1000))}
      </span>
    </div>
  );
};

/** Body weight over time, one point per entry (oldest left). */
const WeightChart = ({ entries }: { entries: readonly WeightEntry[] }) => {
  const { t, i18n } = useTranslation("fitness");
  const weight = useWeightFormat();
  const locale = i18n.language === "mk" ? "mk-MK" : "en-GB";

  const dayLabel = useMemo(
    () => new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" }),
    [locale]
  );

  const points: Point[] = entries.map((entry) => ({
    date: entry.date,
    kg: gramsToKg(entry.weightGrams),
    label: dayLabel.format(localOfIso(entry.date)),
  }));

  const values = points.map((point) => point.kg);
  const low = Math.floor(Math.min(...values) - PADDING_KG);
  const high = Math.ceil(Math.max(...values) + PADDING_KG);

  const config: ChartConfig = {
    kg: { color: "var(--chart-1)", label: t("weight.title") },
  };

  return (
    <ChartContainer
      aria-label={t("weight.chartLabel")}
      className="aspect-auto h-56 w-full"
      config={config}
    >
      <LineChart
        accessibilityLayer
        data={points}
        margin={{ left: 0, right: 8 }}
      >
        <CartesianGrid vertical={false} />
        <XAxis
          axisLine={false}
          dataKey="label"
          minTickGap={24}
          tickLine={false}
          tickMargin={8}
        />
        <YAxis
          axisLine={false}
          domain={[low, high]}
          tickFormatter={(value: number) => weight.value(value)}
          tickLine={false}
          width={40}
        />
        <ChartTooltip content={<WeightTooltip />} cursor={false} />
        <Line
          dataKey="kg"
          dot={points.length <= 31}
          stroke="var(--color-kg)"
          strokeWidth={2}
          type="monotone"
        />
      </LineChart>
    </ChartContainer>
  );
};

export default WeightChart;
