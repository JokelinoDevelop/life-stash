import { useQuery } from "@tanstack/react-query";
import { Plus, Wrench } from "lucide-react";
import { useTranslation } from "react-i18next";

import { PagedList } from "@/components/app/list-pagination";
import { ListSection } from "@/components/app/list-section";
import { PageStack } from "@/components/app/page-header";
import { EmptyState, ErrorState, LoadingState } from "@/components/app/states";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { paginate } from "@/lib/paginate";
import { CAR_SHORTCUTS } from "@/lib/shortcuts";

import { useTabPage } from "../cars/use-tab-page";
import { EntryDialogLink } from "../entry-dialogs/entry-dialog-link";
import { groupByYear } from "./group-by-year";
import { ItemHistoryCard } from "./item-history-card";
import { VisitRow } from "./visit-row";
import { visitsQuery } from "./visits.queries";
import type { VisitListItem } from "./visits.queries";

/** One page of visits under year headings; a heading counts the whole year. */
const VisitPages = ({
  carId,
  visits,
}: {
  carId: string;
  visits: VisitListItem[];
}) => {
  const { page, setPage } = useTabPage();
  const slice = paginate(visits, page);

  const perYear = new Map(
    groupByYear(visits).map(([year, entries]) => [year, entries.length])
  );

  return (
    <PagedList onPageChange={setPage} slice={slice}>
      {groupByYear(slice.items).map(([year, entries]) => (
        <ListSection count={perYear.get(year)} key={year} title={year}>
          {entries.map((visit) => (
            <VisitRow carId={carId} key={visit.id} shortDate visit={visit} />
          ))}
        </ListSection>
      ))}
    </PagedList>
  );
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
    <Button
      size="compact"
      render={<EntryDialogLink entry={{ car: carId, dialog: "service" }} />}
      nativeButton={false}
    >
      <Plus />
      {t("history.add")}
      <Kbd className="hidden md:inline-flex">
        {CAR_SHORTCUTS.addService.toUpperCase()}
      </Kbd>
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
      <PageStack>
        <EmptyState
          action={addButton}
          icon={<Wrench />}
          message={t("history.empty")}
        />
      </PageStack>
    );
  }

  return (
    <PageStack>
      {addButton !== null && (
        <div className="flex justify-end">{addButton}</div>
      )}
      <div
        className="lg:[&>*+*]:border-divider grid gap-6 md:gap-0 lg:grid-cols-[minmax(0,1fr)_20rem] lg:[&>*+*]:border-l"
        data-bleed=""
      >
        <div className="flex min-w-0 flex-col gap-6 md:gap-0">
          <VisitPages carId={carId} visits={visits.data.visits} />
        </div>
        <div>
          <ItemHistoryCard carId={carId} />
        </div>
      </div>
    </PageStack>
  );
};
