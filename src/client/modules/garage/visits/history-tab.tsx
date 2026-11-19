import { useQuery } from "@tanstack/react-query";
import { Plus, Wrench } from "lucide-react";
import { useTranslation } from "react-i18next";

import { ListSection } from "@/components/app/list-section";
import { PageStack } from "@/components/app/page-header";
import { EmptyState, ErrorState, LoadingState } from "@/components/app/states";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { CAR_SHORTCUTS } from "@/lib/shortcuts";

import { EntryDialogLink } from "../entry-dialogs/entry-dialog-link";
import { ItemHistoryCard } from "./item-history-card";
import { VisitRow } from "./visit-row";
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
    <Button asChild size="compact">
      <EntryDialogLink entry={{ car: carId, dialog: "service" }}>
        <Plus />
        {t("history.add")}
        <Kbd className="hidden md:inline-flex">
          {CAR_SHORTCUTS.addService.toUpperCase()}
        </Kbd>
      </EntryDialogLink>
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
          {groupByYear(visits.data.visits).map(([year, entries]) => (
            <ListSection count={entries.length} key={year} title={year}>
              {entries.map((visit) => (
                <VisitRow carId={carId} key={visit.id} visit={visit} />
              ))}
            </ListSection>
          ))}
        </div>
        <div>
          <ItemHistoryCard carId={carId} />
        </div>
      </div>
    </PageStack>
  );
};
