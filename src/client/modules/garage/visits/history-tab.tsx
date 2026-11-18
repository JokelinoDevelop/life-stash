import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Plus, Wrench } from "lucide-react";
import { useTranslation } from "react-i18next";

import { EmptyState, ErrorState, LoadingState } from "@/components/app/states";
import { Button } from "@/components/ui/button";

import { ItemHistoryCard } from "./item-history-card";
import { VisitCard } from "./visit-card";
import { visitsQuery } from "./visits.queries";
import type { VisitListItem } from "./visits.queries";

const groupByYear = (visits: VisitListItem[]): [string, VisitListItem[]][] => {
  const groups = new Map<string, VisitListItem[]>();

  for (const visit of visits) {
    const year = visit.date.slice(0, 4);
    groups.set(year, [...(groups.get(year) ?? []), visit]);
  }

  return [...groups.entries()];
};

export const HistoryTab = ({
  carId,
  readOnly,
}: {
  carId: string;
  readOnly: boolean;
}) => {
  const { t } = useTranslation("garageVisits");
  const visits = useQuery(visitsQuery(carId));

  const addButton = readOnly ? null : (
    <Button asChild>
      <Link params={{ carId }} to="/garage/cars/$carId/services/new">
        <Plus />
        {t("history.add")}
      </Link>
    </Button>
  );

  if (visits.isPending) {
    return <LoadingState />;
  }

  if (visits.isError) {
    return (
      <ErrorState
        error={visits.error}
        onRetry={() => {
          void visits.refetch();
        }}
      />
    );
  }

  if (visits.data.visits.length === 0) {
    return (
      <EmptyState
        action={addButton}
        icon={<Wrench className="size-10" />}
        message={t("history.empty")}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {addButton !== null && (
        <div className="flex justify-end">{addButton}</div>
      )}
      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <ol className="flex flex-col gap-6">
          {groupByYear(visits.data.visits).map(([year, entries]) => (
            <li className="flex flex-col gap-3" key={year}>
              <h3 className="text-muted-foreground text-sm font-semibold">
                {year}
              </h3>
              <ul className="flex flex-col gap-3 border-l pl-4">
                {entries.map((visit) => (
                  <li key={visit.id}>
                    <VisitCard carId={carId} visit={visit} />
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
        <div>
          <ItemHistoryCard carId={carId} />
        </div>
      </div>
    </div>
  );
};
