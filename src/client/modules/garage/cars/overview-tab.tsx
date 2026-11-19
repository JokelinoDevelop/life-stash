import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { SectionHeading } from "@/components/app/list-section";
import { ErrorState, LoadingState } from "@/components/app/states";
import { useFormat } from "@/lib/format";
import { todayIso } from "@/lib/partial-date";

import { mileageQuery } from "../mileage/mileage.queries";
import type { MileagePoint } from "../mileage/mileage.queries";
import { remindersQuery } from "../reminders/reminders.queries";
import type { ActiveReminder } from "../reminders/reminders.queries";
import { carSpendingQuery } from "../spending/spending.queries";
import type { CarSpendingYear } from "../spending/spending.queries";
import { visitsQuery } from "../visits/visits.queries";
import type { VisitListItem } from "../visits/visits.queries";
import { CarSidePanel } from "./car-side-panel";
import { OdometerSummary } from "./odometer-chart";
import { CarHistory, CarReminders } from "./overview-cards";
import { SpendingBreakdown } from "./spending-breakdown";
import { yearTotal } from "./spending-total";
import { useCarFigures } from "./use-car-figures";

interface CarDetails {
  fuelType: string | null;
  make: string | null;
  model: string | null;
  plate: string | null;
  vin: string | null;
  year: number | null;
}

const MiniStat = ({ label, value }: { label: string; value: string }) => (
  <div className="flex min-w-0 flex-col px-4 py-3">
    <span className="text-muted-foreground truncate text-xs">{label}</span>
    <span className="truncate font-semibold tabular-nums">{value}</span>
  </div>
);

/** Phones: this year's spending with a stacked bar and legend. */
const SpentPanel = ({
  carId,
  spending,
  year,
}: {
  carId: string;
  spending: CarSpendingYear;
  year: number;
}) => {
  const { t } = useTranslation("garage");
  const format = useFormat();
  const total = yearTotal(spending);
  const monthsSoFar = Number(todayIso().slice(5, 7));

  return (
    <section className="flex flex-col gap-2 md:hidden">
      <SectionHeading
        action={
          <Link
            className="text-primary text-sm font-medium"
            params={{ carId }}
            search={{ tab: "spending" }}
            to="/garage/cars/$carId"
          >
            {t("overview.breakdown")}
          </Link>
        }
        title={t("overview.spentIn", { year })}
      />
      <div className="bg-card rounded-lg border px-4 pt-3.5 pb-1">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-2xl font-semibold tracking-tight tabular-nums">
            {format.money(total, spending.currency)}
          </span>
          <span className="text-muted-foreground text-sm tabular-nums">
            {t("overview.perMonthAmount", {
              amount: format.money(
                Math.round(total / monthsSoFar),
                spending.currency
              ),
            })}
          </span>
        </div>
        <SpendingBreakdown year={spending} />
      </div>
    </section>
  );
};

const OverviewContent = ({
  car,
  carId,
  points,
  readOnly,
  reminders,
  visits,
  years,
}: {
  car: CarDetails;
  carId: string;
  points: MileagePoint[];
  readOnly: boolean;
  reminders: ActiveReminder[];
  visits: VisitListItem[];
  years: CarSpendingYear[];
}) => {
  const { t } = useTranslation("garage");
  const { t: tc } = useTranslation();
  const format = useFormat();
  const today = todayIso();
  const year = Number(today.slice(0, 4));
  const figures = useCarFigures(points, years, year);
  const { costPerDistance, kmThisYear, thisYear } = figures;
  const averageText = figures.averagePerMonth;

  return (
    <div className="flex flex-col gap-6 md:flex-row md:gap-0">
      <div className="flex min-w-0 flex-1 flex-col gap-6 md:gap-0">
        {points.length > 0 && (
          <section className="bg-card overflow-hidden rounded-lg border md:rounded-none md:border-0 md:px-7 md:py-5">
            <div className="px-4 pt-4 md:p-0">
              <OdometerSummary points={points} today={today} />
            </div>
            <div className="divide-divider border-divider grid grid-cols-3 divide-x border-t md:hidden">
              <MiniStat
                label={t("overview.thisYearShort")}
                value={format.distance(kmThisYear)}
              />
              <MiniStat
                label={t("overview.perMonth")}
                value={averageText ?? "—"}
              />
              <MiniStat
                label={t("overview.costPerDistance", {
                  unit: tc(`units.${format.unit}`),
                })}
                value={costPerDistance ?? "—"}
              />
            </div>
          </section>
        )}
        <CarReminders carId={carId} readOnly={readOnly} reminders={reminders} />
        {thisYear !== undefined && (
          <SpentPanel carId={carId} spending={thisYear} year={year} />
        )}
        <CarHistory carId={carId} visits={visits} />
      </div>
      <CarSidePanel
        averagePerMonth={averageText}
        car={car}
        costPerDistance={costPerDistance}
        spending={thisYear}
        year={year}
      />
    </div>
  );
};

/** What's due, what's done, how far and how much: artifact "Car overview". */
export const OverviewTab = ({
  car,
  carId,
  readOnly,
}: {
  car: CarDetails;
  carId: string;
  readOnly: boolean;
}) => {
  const mileage = useQuery(mileageQuery(carId));
  const reminders = useQuery(remindersQuery(carId));
  const visits = useQuery(visitsQuery(carId));
  const spending = useQuery(carSpendingQuery(carId));

  if (mileage.isPending || reminders.isPending || visits.isPending) {
    return <LoadingState rows={4} />;
  }

  if (mileage.isError || reminders.isError || visits.isError) {
    return (
      <ErrorState
        error={mileage.error ?? reminders.error ?? visits.error}
        onRetry={() => {
          void mileage.refetch();
          void reminders.refetch();
          void visits.refetch();
        }}
      />
    );
  }

  return (
    <OverviewContent
      car={car}
      carId={carId}
      points={mileage.data.points}
      readOnly={readOnly}
      reminders={reminders.data.active}
      visits={visits.data.visits}
      years={spending.data?.years ?? []}
    />
  );
};
