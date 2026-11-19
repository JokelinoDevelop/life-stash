import { latestOdometer } from "@shared/domain/mileage";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { Gauge } from "lucide-react";
import { lazy, Suspense, useState } from "react";
import { useTranslation } from "react-i18next";

import { PageStack } from "@/components/app/page-header";
import { EmptyState, ErrorState, LoadingState } from "@/components/app/states";
import { Button } from "@/components/ui/button";
import { todayIso } from "@/lib/partial-date";

import { MileageStats } from "./mileage-stats";
import { mileageQuery } from "./mileage.queries";
import type { MileagePoint } from "./mileage.queries";
import { ReadingDialog } from "./reading-dialog";
import { ReadingsList } from "./readings-list";

const MileageCharts = lazy(async () => {
  const module = await import("./mileage-charts");

  return { default: module.MileageCharts };
});

interface DialogState {
  open: boolean;
  reading: MileagePoint | null;
}

export const MileageTab = ({
  carId,
  readOnly,
}: {
  carId: string;
  readOnly: boolean;
}) => {
  const { t } = useTranslation("garageMileage");
  const search = useSearch({ from: "/_app/garage/cars/$carId/" });
  const navigate = useNavigate({ from: "/garage/cars/$carId/" });
  const mileage = useQuery(mileageQuery(carId));

  const [dialog, setDialog] = useState<DialogState>({
    open: false,
    reading: null,
  });

  const today = todayIso();

  // `?log=true` (from quick actions and notifications) opens the log dialog directly.
  const autoOpen = search.log === true && !readOnly;

  if (mileage.isPending) {
    return <LoadingState rows={3} />;
  }

  if (mileage.isError) {
    return (
      <ErrorState
        error={mileage.error}
        onRetry={() => {
          void mileage.refetch();
        }}
      />
    );
  }

  const { points } = mileage.data;
  const latestKm = latestOdometer(points)?.odometerKm ?? null;

  const logButton = readOnly ? null : (
    <Button
      onClick={() => {
        setDialog({ open: true, reading: null });
      }}
      size="compact"
    >
      <Gauge />
      {t("log")}
    </Button>
  );

  return (
    <PageStack>
      {points.length === 0 ? (
        <EmptyState
          action={logButton}
          icon={<Gauge className="size-10" />}
          message={t("list.empty")}
        />
      ) : (
        <>
          {logButton !== null && (
            <div className="flex justify-end">{logButton}</div>
          )}
          <MileageStats points={points} today={today} />
          <Suspense fallback={<LoadingState rows={1} />}>
            <MileageCharts points={points} today={today} />
          </Suspense>
          <ReadingsList
            onEdit={(reading) => {
              setDialog({ open: true, reading });
            }}
            points={points}
            readOnly={readOnly}
          />
        </>
      )}
      <ReadingDialog
        carId={carId}
        latestKm={latestKm}
        onOpenChange={(open) => {
          setDialog((current) => ({ ...current, open }));

          if (!open && autoOpen) {
            void navigate({ replace: true, search: { tab: "mileage" } });
          }
        }}
        open={dialog.open || autoOpen}
        reading={autoOpen ? null : dialog.reading}
      />
    </PageStack>
  );
};
