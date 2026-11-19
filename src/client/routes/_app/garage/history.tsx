import { useQueries, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Wrench } from "lucide-react";
import { useTranslation } from "react-i18next";

import { ListSection } from "@/components/app/list-section";
import { PageHeader, PageStack } from "@/components/app/page-header";
import { EmptyState, LoadingState } from "@/components/app/states";
import { carsQuery } from "@/modules/garage/cars/cars.queries";
import { VisitRow } from "@/modules/garage/visits/visit-row";
import { visitsQuery } from "@/modules/garage/visits/visits.queries";
import type { VisitListItem } from "@/modules/garage/visits/visits.queries";

interface Entry {
  carId: string;
  carName: string;
  visit: VisitListItem;
}

const byYear = (entries: Entry[]): [string, Entry[]][] => {
  const groups = new Map<string, Entry[]>();

  for (const entry of entries) {
    const year = entry.visit.date.slice(0, 4);
    groups.set(year, [...(groups.get(year) ?? []), entry]);
  }

  return [...groups.entries()];
};

const HistoryPage = () => {
  const { t } = useTranslation();
  const { t: tg } = useTranslation("garage");
  const cars = useQuery(carsQuery(false));
  const list = cars.data?.cars ?? [];

  const visits = useQueries({
    queries: list.map((car) => visitsQuery(car.id)),
  });

  const pending = cars.isPending || visits.some((query) => query.isPending);

  const entries = list
    .flatMap((car, index) =>
      (visits[index]?.data?.visits ?? []).map((visit) => ({
        carId: car.id,
        carName: car.name,
        visit,
      }))
    )
    .toSorted((a, b) => b.visit.date.localeCompare(a.visit.date));

  return (
    <>
      <PageHeader title={t("nav.history")} />
      {pending && <LoadingState />}
      {!pending && (
        <PageStack>
          {entries.length === 0 ? (
            <EmptyState icon={<Wrench />} message={tg("home.historyEmpty")} />
          ) : (
            byYear(entries).map(([year, group]) => (
              <ListSection count={group.length} key={year} title={year}>
                {group.map((entry) => (
                  <VisitRow
                    carId={entry.carId}
                    carName={entry.carName}
                    key={entry.visit.id}
                    visit={entry.visit}
                  />
                ))}
              </ListSection>
            ))
          )}
        </PageStack>
      )}
    </>
  );
};

export const Route = createFileRoute("/_app/garage/history")({
  component: HistoryPage,
});
