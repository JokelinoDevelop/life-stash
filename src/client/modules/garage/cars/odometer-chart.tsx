import { daysBetween } from "@shared/domain/dates";
import { latestOdometer, withDeltas } from "@shared/domain/mileage";
import type { OdometerPoint } from "@shared/domain/mileage";
import { odometerByMonth } from "@shared/domain/mileage-buckets";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useFormat } from "@/lib/format";
import { cn } from "@/lib/utils";

const RANGES = { "1y": 12, "6m": 6, all: 0 } as const;

const RANGE_KEYS = ["6m", "1y", "all"] as const;

type Range = keyof typeof RANGES;

const isRange = (value: string): value is Range => value in RANGES;

const MAX_MONTHS = 120;
const CHART_WIDTH = 600;
const CHART_HEIGHT = 120;
const CHART_PADDING = 10;

const monthsSince = (first: string, today: string): number =>
  (Number(today.slice(0, 4)) - Number(first.slice(0, 4))) * 12 +
  Number(today.slice(5, 7)) -
  Number(first.slice(5, 7)) +
  1;

/** SVG path through the known monthly odometer values. */
const linePath = (values: (number | null)[]): string => {
  const known = values.filter((value): value is number => value !== null);
  const min = Math.min(...known);
  const span = Math.max(1, Math.max(...known) - min);
  const step = CHART_WIDTH / Math.max(1, values.length - 1);
  const usable = CHART_HEIGHT - CHART_PADDING * 2;
  const commands: string[] = [];

  for (const [index, value] of values.entries()) {
    if (value !== null) {
      const y = CHART_PADDING + usable - ((value - min) / span) * usable;
      commands.push(`${commands.length === 0 ? "M" : "L"}${index * step} ${y}`);
    }
  }

  return commands.join(" ");
};

const useMonthLabel = () => {
  const { i18n } = useTranslation();

  return useMemo(() => {
    const format = new Intl.DateTimeFormat(
      i18n.language === "mk" ? "mk-MK" : "en-GB",
      { month: "short", timeZone: "UTC" }
    );

    return (month: string) => format.format(new Date(`${month}-01T00:00:00Z`));
  }, [i18n.language]);
};

const RangeSwitch = ({
  onChange,
  value,
}: {
  onChange: (range: Range) => void;
  value: Range;
}) => {
  const { t } = useTranslation("garage");

  return (
    <ToggleGroup
      aria-label={t("overview.rangeLabel")}
      onValueChange={(next) => {
        if (isRange(next)) {
          onChange(next);
        }
      }}
      size="segmented"
      spacing={0.5}
      type="single"
      value={value}
      variant="segmented"
    >
      {RANGE_KEYS.map((range) => (
        <ToggleGroupItem key={range} value={range}>
          {t(`overview.range.${range}`)}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
};

/** Big odometer figure, change since the previous reading and a monthly line. */
export const OdometerSummary = ({
  points,
  today,
}: {
  points: readonly OdometerPoint[];
  today: string;
}) => {
  const { t } = useTranslation("garage");
  const { t: tc } = useTranslation();
  const format = useFormat();
  const monthLabel = useMonthLabel();
  const [range, setRange] = useState<Range>("1y");
  const latest = latestOdometer(points);
  const deltas = withDeltas(points);
  const last = deltas.at(-1);

  if (latest === null) {
    return null;
  }

  const months =
    RANGES[range] === 0
      ? Math.min(
          MAX_MONTHS,
          Math.max(2, monthsSince(deltas[0]?.reading.date ?? today, today))
        )
      : RANGES[range];

  const series = odometerByMonth(points, today, months);
  const values = series.map((entry) => entry.odometerKm);
  const labelEvery = Math.max(1, Math.ceil(series.length / 7));
  const ago = daysBetween(latest.date, today);

  return (
    <div className="flex flex-col">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-muted-foreground text-xs font-medium md:text-sm">
            {t("overview.odometer")}
          </p>
          <p className="mt-0.5 text-3xl font-semibold tracking-tight tabular-nums">
            {format.number(latest.odometerKm)}
            <span className="text-muted-foreground ml-1.5 text-base font-medium tracking-normal">
              {tc(`units.${format.unit}`)}
            </span>
          </p>
          <p className="text-muted-foreground mt-0.5 text-sm tabular-nums">
            {last?.kmSincePrevious !== null &&
              last?.kmSincePrevious !== undefined &&
              deltas.length > 1 && (
                <>
                  <span className="text-success font-medium">
                    {t("overview.sinceDate", {
                      date: format.date(
                        deltas.at(-2)?.reading.date ?? latest.date
                      ),
                      distance: format.distance(last.kmSincePrevious),
                    })}
                  </span>
                  {" · "}
                </>
              )}
            {t("overview.logged", {
              when:
                ago === 0
                  ? tc("relative.today")
                  : tc("relative.daysAgo", { count: ago }),
            })}
          </p>
        </div>
        <div className="hidden md:block">
          <RangeSwitch onChange={setRange} value={range} />
        </div>
      </div>
      <div className="border-border relative mt-4 h-16 border-b md:h-30">
        <span className="border-divider absolute inset-x-0 top-1/3 hidden border-t md:block" />
        <span className="border-divider absolute inset-x-0 top-2/3 hidden border-t md:block" />
        <svg
          aria-hidden="true"
          className="text-primary absolute inset-0 size-full"
          preserveAspectRatio="none"
          viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
        >
          <path
            d={linePath(values)}
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="1.5"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>
      <div className="text-muted-foreground mt-1.5 hidden justify-between text-xs tabular-nums md:flex">
        {series.map((entry, index) =>
          index % labelEvery === 0 || index === series.length - 1 ? (
            <span
              className={cn(
                index === series.length - 1 && "text-foreground font-medium"
              )}
              key={entry.month}
            >
              {monthLabel(entry.month)}
            </span>
          ) : null
        )}
      </div>
    </div>
  );
};
