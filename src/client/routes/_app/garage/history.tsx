import { useQueries, useQuery } from "@tanstack/react-query";
import type { QueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Wrench } from "lucide-react";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import { BackLink } from "@/components/app/back-link";
import { PagedList } from "@/components/app/list-pagination";
import { ListSection } from "@/components/app/list-section";
import { PageHeader, PageStack } from "@/components/app/page-header";
import { EmptyState, LoadingState } from "@/components/app/states";
import { paginate } from "@/lib/paginate";
import { cached, warm } from "@/lib/warm";
import { carsQuery } from "@/modules/garage/cars/cars.queries";
import { groupByYear } from "@/modules/garage/visits/group-by-year";
import { VisitRow } from "@/modules/garage/visits/visit-row";
import { visitsQuery } from "@/modules/garage/visits/visits.queries";

const HistoryPage = () => {
  const { t } = useTranslation();
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
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
    .toSorted((a, b) => b.visit.date.localeCompare(a.visit.date))
    .map((entry) => ({ ...entry, date: entry.visit.date }));

  const slice = paginate(entries, search.page ?? 1);

  const perYear = new Map(
    groupByYear(entries).map(([year, group]) => [year, group.length])
  );

  const setPage = (next: number) => {
    void navigate({
      replace: true,
      resetScroll: false,
      search: next > 1 ? { page: next } : {},
    });
  };

  return (
    <>
      <PageHeader
        mobileTop={<BackLink to="/garage" />}
        title={t("nav.history")}
      />
      {pending && <LoadingState />}
      {!pending && (
        <PageStack>
          {entries.length === 0 ? (
            <EmptyState icon={<Wrench />} message={tg("home.historyEmpty")} />
          ) : (
            <PagedList onPageChange={setPage} slice={slice}>
              {groupByYear(slice.items).map(([year, group]) => (
                <ListSection count={perYear.get(year)} key={year} title={year}>
                  {group.map((entry) => (
                    <VisitRow
                      carId={entry.carId}
                      carName={entry.carName}
                      key={entry.visit.id}
                      shortDate
                      visit={entry.visit}
                    />
                  ))}
                </ListSection>
              ))}
            </PagedList>
          )}
        </PageStack>
      )}
    </>
  );
};

/** Visits need the car list first: one round for the cars, then all visits at once. */
const warmHistory = async (queryClient: QueryClient) => {
  const cars = await queryClient
    .query(cached(carsQuery(false)))
    .catch(() => null);

  const loads: Promise<unknown>[] = [];

  for (const car of cars?.cars ?? []) {
    loads.push(queryClient.query(cached(visitsQuery(car.id))));
  }

  await warm(...loads);
};

export const Route = createFileRoute("/_app/garage/history")({
  validateSearch: z.object({
    page: z.number().int().min(2).optional().catch(undefined),
  }),
  loader: async ({ context: { queryClient } }) => {
    await warmHistory(queryClient);
  },
  component: HistoryPage,
});
