import { useTranslation } from "react-i18next";

import { useFormat } from "@/lib/format";
import { cn } from "@/lib/utils";

import type { CarSpendingYear } from "../spending/spending.queries";

const LAST_COLOR = "bg-chart-4";

const SEGMENT_COLORS = [
  "bg-chart-1",
  "bg-chart-2",
  "bg-chart-3",
  LAST_COLOR,
] as const;

const MAX_SEGMENTS = 4;

interface Segment {
  key: string;
  label: string;
  amountMinor: number;
}

/** Maintenance, repairs and the largest expense categories; the rest folds into "Other". */
export const useSegments = (year: CarSpendingYear | undefined): Segment[] => {
  const { t } = useTranslation("garage");
  const { t: ts } = useTranslation("garageSpending");
  const { t: te } = useTranslation("garageExpenses");

  if (year === undefined) {
    return [];
  }

  const all: Segment[] = [
    {
      amountMinor: year.maintenanceMinor,
      key: "maintenance",
      label: ts("columns.maintenance"),
    },
    {
      amountMinor: year.repairMinor,
      key: "repair",
      label: ts("columns.repair"),
    },
    ...year.otherByCategory.map((entry) => ({
      amountMinor: entry.amountMinor,
      key: entry.category,
      label: te(`categories.${entry.category}`),
    })),
  ]
    .filter((segment) => segment.amountMinor > 0)
    .toSorted((a, b) => b.amountMinor - a.amountMinor);

  if (all.length <= MAX_SEGMENTS) {
    return all;
  }

  const head = all.slice(0, MAX_SEGMENTS - 1);
  const rest = all.slice(MAX_SEGMENTS - 1);

  return [
    ...head,
    {
      amountMinor: rest.reduce((sum, segment) => sum + segment.amountMinor, 0),
      key: "rest",
      label: t("overview.other"),
    },
  ];
};

/** Stacked bar and legend rows for one year's spending. */
export const SpendingBreakdown = ({
  dense = false,
  year,
}: {
  dense?: boolean;
  year: CarSpendingYear;
}) => {
  const format = useFormat();
  const segments = useSegments(year);
  const total = segments.reduce((sum, segment) => sum + segment.amountMinor, 0);

  return (
    <div className="flex flex-col">
      <div
        aria-hidden="true"
        className={cn(
          "flex gap-0.5 overflow-hidden rounded-full",
          dense ? "my-2.5 h-1" : "my-3 h-1.5"
        )}
      >
        {segments.map((segment, index) => (
          <span
            className={cn(
              "grow-(--share)",
              SEGMENT_COLORS[index] ?? LAST_COLOR
            )}
            key={segment.key}
            style={{ "--share": segment.amountMinor }}
          />
        ))}
      </div>
      <ul className={cn(!dense && "divide-divider divide-y")}>
        {segments.map((segment, index) => (
          <li
            className={cn("flex items-center gap-2.5", dense ? "h-7" : "h-9")}
            key={segment.key}
          >
            <span
              className={cn(
                "size-2 shrink-0 rounded-xs",
                SEGMENT_COLORS[index] ?? LAST_COLOR
              )}
            />
            <span className="min-w-0 flex-1 truncate">{segment.label}</span>
            {!dense && (
              <span className="text-muted-foreground w-10 text-xs tabular-nums">
                {total === 0
                  ? 0
                  : Math.round((segment.amountMinor / total) * 100)}
                %
              </span>
            )}
            <span
              className={cn(
                "w-16 text-right tabular-nums",
                dense ? "text-muted-foreground" : "font-medium"
              )}
            >
              {format.money(segment.amountMinor, year.currency)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};
