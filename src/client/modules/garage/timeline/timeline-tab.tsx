import { latestOdometer } from "@shared/domain/mileage";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { History } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { useConfirm } from "@/components/app/confirm/confirm-context";
import { PageStack } from "@/components/app/page-header";
import { EmptyState, ErrorState, LoadingState } from "@/components/app/states";
import { api, unwrap } from "@/lib/api";
import { useErrorMessage } from "@/lib/errors";

import { useInvalidateGarage } from "../cars/cars.queries";
import { expensesQuery } from "../expenses/expenses.queries";
import { mileageQuery } from "../mileage/mileage.queries";
import type { MileagePoint } from "../mileage/mileage.queries";
import { ReadingDialog } from "../mileage/reading-dialog";
import { visitsQuery } from "../visits/visits.queries";
import { buildTimeline } from "./build-timeline";
import { FilterBar, TimelineList } from "./timeline-rows";

/** Deletes a stand-alone odometer reading after a confirm. */
const useDeleteReading = () => {
  const { t } = useTranslation("garageMileage");
  const { t: tc } = useTranslation();
  const confirm = useConfirm();
  const errorMessage = useErrorMessage();
  const invalidate = useInvalidateGarage();

  return async (reading: MileagePoint) => {
    const ok = await confirm({
      confirmLabel: tc("actions.delete"),
      title: tc("confirmDelete.title"),
      tone: "destructive",
    });

    if (!ok) {
      return;
    }

    try {
      await unwrap(
        api.garage.mileage[":readingId"].$delete({
          param: { readingId: reading.id },
        })
      );
      await invalidate();
      toast.success(t("deleted"));
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };
};

interface DialogState {
  open: boolean;
  reading: MileagePoint | null;
}

/**
 * Everything that happened to the car, newest first: services, expenses and
 * odometer readings in one list, 12 a page, under year headings.
 */
export const TimelineTab = ({
  carId,
  readOnly,
}: {
  carId: string;
  readOnly: boolean;
}) => {
  const { t } = useTranslation("garage");
  const search = useSearch({ from: "/_app/garage/cars/$carId/" });
  const navigate = useNavigate({ from: "/garage/cars/$carId/" });
  const removeReading = useDeleteReading();
  const visits = useQuery(visitsQuery(carId));
  const expenses = useQuery(expensesQuery(carId));
  const mileage = useQuery(mileageQuery(carId));

  const [dialog, setDialog] = useState<DialogState>({
    open: false,
    reading: null,
  });

  const filter = search.show ?? "all";

  // `?log=true` (quick actions, the L key, notifications) opens the reading dialog.
  const autoOpen = search.log === true && !readOnly;

  if (visits.isPending || expenses.isPending || mileage.isPending) {
    return <LoadingState />;
  }

  if (visits.isError || expenses.isError || mileage.isError) {
    return (
      <ErrorState
        error={visits.error ?? expenses.error ?? mileage.error}
        onRetry={() => {
          void visits.refetch();
          void expenses.refetch();
          void mileage.refetch();
        }}
      />
    );
  }

  const latestPoint = latestOdometer(mileage.data.points);

  const latest =
    latestPoint === null
      ? null
      : { date: latestPoint.date, km: latestPoint.odometerKm };

  const entries = buildTimeline(
    {
      expenses: expenses.data.expenses,
      readings: mileage.data.points,
      visits: visits.data.visits,
    },
    filter
  );

  return (
    <PageStack>
      <FilterBar
        filter={filter}
        onChange={(next) => {
          void navigate({
            replace: true,
            resetScroll: false,
            search: ({ page: _page, show: _show, ...rest }) =>
              next === "all" ? rest : { ...rest, show: next },
          });
        }}
      />
      {entries.length === 0 ? (
        <EmptyState
          icon={<History />}
          message={t(`timeline.empty.${filter}`)}
        />
      ) : (
        <TimelineList
          carId={carId}
          entries={entries}
          onDeleteReading={(reading) => {
            void removeReading(reading);
          }}
          onEditReading={(reading) => {
            setDialog({ open: true, reading });
          }}
          readOnly={readOnly}
        />
      )}
      <ReadingDialog
        carId={carId}
        latest={latest}
        onOpenChange={(open) => {
          setDialog((current) => ({ ...current, open }));

          if (!open && autoOpen) {
            void navigate({
              replace: true,
              search: ({ log: _log, ...rest }) => rest,
            });
          }
        }}
        open={dialog.open || autoOpen}
        reading={autoOpen ? null : dialog.reading}
      />
    </PageStack>
  );
};
