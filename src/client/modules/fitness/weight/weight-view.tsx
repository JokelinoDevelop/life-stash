import { addDays } from "@shared/domain/dates";
import { weightChange } from "@shared/domain/fitness/weight";
import { useQuery } from "@tanstack/react-query";
import { Scale } from "lucide-react";
import { lazy, Suspense } from "react";
import { useTranslation } from "react-i18next";

import { PagedList } from "@/components/app/list-pagination";
import {
  ListRow,
  ListRowText,
  ListSection,
  Panel,
} from "@/components/app/list-section";
import { PageStack } from "@/components/app/page-header";
import { Stat, StatPanel } from "@/components/app/stat-panel";
import { EmptyState, ErrorState, LoadingState } from "@/components/app/states";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useFormat } from "@/lib/format";
import { paginate } from "@/lib/paginate";

import { FitnessDialogLink } from "../dialogs/fitness-dialog-link";
import { weightQuery } from "../fitness.queries";
import type { WeightEntry } from "../fitness.queries";
import { useWeightFormat } from "./use-weight-format";
import { WEIGHT_RANGES } from "./weight-ranges";
import type { WeightRange } from "./weight-ranges";

const WeightChart = lazy(async () => await import("./weight-chart"));

/** Latest, 7 / 30-day change and the lowest weight in the range. */
const WeightStats = ({ rows }: { rows: readonly WeightEntry[] }) => {
  const { t } = useTranslation("fitness");
  const weight = useWeightFormat();
  const latest = rows.at(-1);
  const lowest = Math.min(...rows.map((row) => row.weightGrams));

  return (
    <StatPanel bleed>
      <Stat
        label={t("weight.latest")}
        value={weight.kg(latest?.weightGrams ?? null)}
      />
      <Stat
        label={t("weight.change7")}
        value={weight.change(weightChange(rows, 7))}
      />
      <Stat
        label={t("weight.change30")}
        value={weight.change(weightChange(rows, 30))}
      />
      <Stat label={t("weight.lowest")} value={weight.kg(lowest)} />
    </StatPanel>
  );
};

/** The weight page: chart over the chosen range, 7 / 30-day change, and every entry. */
export const WeightView = ({
  onPageChange,
  onRangeChange,
  page,
  range,
  today,
}: {
  onPageChange: (page: number) => void;
  onRangeChange: (range: WeightRange) => void;
  page: number;
  range: WeightRange;
  today: string;
}) => {
  const { t } = useTranslation("fitness");
  const format = useFormat();
  const weight = useWeightFormat();
  const entries = useQuery(weightQuery(addDays(today, -Number(range)), today));

  if (entries.isPending) {
    return <LoadingState />;
  }

  if (entries.isError) {
    return (
      <ErrorState
        error={entries.error}
        onRetry={() => {
          void entries.refetch();
        }}
      />
    );
  }

  const rows = entries.data.entries;

  if (rows.length === 0) {
    return (
      <EmptyState
        action={
          <Button
            nativeButton={false}
            render={<FitnessDialogLink entry={{ dialog: "weight" }} />}
            size="compact"
          >
            {t("weight.add")}
          </Button>
        }
        icon={<Scale />}
        message={t("weight.emptyMessage")}
        title={t("weight.emptyTitle")}
      />
    );
  }

  const slice = paginate(rows.toReversed(), page);

  return (
    <PageStack>
      <WeightStats rows={rows} />
      <Panel
        action={
          <ToggleGroup
            aria-label={t("weight.range")}
            onValueChange={([value]) => {
              const picked = WEIGHT_RANGES.find((option) => option === value);

              if (picked !== undefined) {
                onRangeChange(picked);
              }
            }}
            size="segmented"
            spacing={0.5}
            value={[range]}
            variant="segmented"
          >
            {WEIGHT_RANGES.map((option) => (
              <ToggleGroupItem key={option} value={option}>
                {t(`weight.ranges.${option}`)}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        }
        title={t("weight.trend")}
      >
        <Suspense fallback={<Skeleton className="h-56 w-full" />}>
          <WeightChart entries={rows} />
        </Suspense>
      </Panel>
      <PagedList onPageChange={onPageChange} slice={slice}>
        <ListSection count={rows.length} title={t("weight.entries")}>
          {slice.items.map((entry) => (
            <ListRow
              key={entry.id}
              render={
                <FitnessDialogLink
                  entry={{ date: entry.date, dialog: "weight" }}
                />
              }
            >
              <ListRowText
                meta={entry.note ?? undefined}
                title={format.date(entry.date)}
              />
              <span className="shrink-0 font-medium tabular-nums">
                {weight.kg(entry.weightGrams)}
              </span>
            </ListRow>
          ))}
        </ListSection>
      </PagedList>
    </PageStack>
  );
};
