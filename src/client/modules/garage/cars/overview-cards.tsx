import { reminderProgress } from "@shared/domain/reminders";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import {
  ListRow,
  ListRowText,
  ListSection,
} from "@/components/app/list-section";
import { StatusRing } from "@/components/app/status-ring";
import { STATUS_TEXT_TONE } from "@/components/app/status-tone";
import type { api, SuccessBody } from "@/lib/api";
import { useFormat } from "@/lib/format";
import { cn } from "@/lib/utils";

import { CompleteReminderButton } from "../reminders/complete-reminder-button";
import type { CarTab } from "./car-tabs";
import { describeDue } from "./describe-due";

type Overview = SuccessBody<
  Awaited<ReturnType<(typeof api.garage.cars)[":carId"]["overview"]["$get"]>>
>;

const ViewAll = ({ carId, tab }: { carId: string; tab: CarTab }) => {
  const { t } = useTranslation("garage");

  return (
    <Link
      className="text-primary text-sm font-medium hover:underline"
      params={{ carId }}
      search={{ tab }}
      to="/garage/cars/$carId"
    >
      {t("overview.viewAll")}
    </Link>
  );
};

export const DueNextCard = ({
  carId,
  readOnly,
  reminders,
}: {
  carId: string;
  readOnly: boolean;
  reminders: Overview["dueReminders"];
}) => {
  const { t } = useTranslation("garage");
  const { t: tc } = useTranslation();
  const format = useFormat();

  return (
    <ListSection
      action={<ViewAll carId={carId} tab="reminders" />}
      count={reminders.length}
      title={t("overview.dueNext")}
    >
      {reminders.length === 0 ? (
        <ListRow className="text-muted-foreground">
          {t("overview.nothingDue")}
        </ListRow>
      ) : (
        reminders.map((reminder) => (
          <ListRow className="py-2 md:py-1" key={reminder.id}>
            <StatusRing
              progress={reminderProgress(reminder)}
              status={reminder.status}
            />
            <ListRowText
              meta={
                <span
                  className={cn(
                    "tabular-nums",
                    STATUS_TEXT_TONE[reminder.status]
                  )}
                >
                  {describeDue(reminder, format, tc)}
                </span>
              }
              title={reminder.title}
            />
            {!readOnly && (
              <CompleteReminderButton carId={carId} reminder={reminder} />
            )}
          </ListRow>
        ))
      )}
    </ListSection>
  );
};

export const RecentVisitsCard = ({
  carId,
  visits,
}: {
  carId: string;
  visits: Overview["recentVisits"];
}) => {
  const { t } = useTranslation("garage");
  const format = useFormat();

  return (
    <ListSection
      action={<ViewAll carId={carId} tab="history" />}
      title={t("overview.lastDone")}
    >
      {visits.length === 0 ? (
        <ListRow className="text-muted-foreground">
          {t("overview.noHistory")}
        </ListRow>
      ) : (
        visits.map((visit) => (
          <ListRow asChild key={visit.id}>
            <Link
              params={{ carId, visitId: visit.id }}
              to="/garage/cars/$carId/services/$visitId"
            >
              <StatusRing label={null} status="done" />
              <ListRowText
                meta={[
                  format.date(visit.date, visit.datePrecision),
                  visit.odometerKm === null
                    ? null
                    : format.distance(visit.odometerKm),
                  visit.byPreviousOwner ? t("overview.previousOwner") : null,
                ]
                  .filter((part) => part !== null)
                  .join(" · ")}
                title={visit.items.join(", ")}
              />
            </Link>
          </ListRow>
        ))
      )}
    </ListSection>
  );
};

const Stat = ({
  hint,
  label,
  value,
}: {
  hint?: string;
  label: string;
  value: string;
}) => (
  <div className="bg-card flex min-w-0 flex-col gap-0.5 px-4 py-3">
    <span className="text-muted-foreground text-xs font-medium md:text-sm">
      {label}
    </span>
    <span className="truncate text-lg font-semibold tracking-tight tabular-nums">
      {value}
    </span>
    {hint !== undefined && (
      <span className="text-muted-foreground truncate text-xs">{hint}</span>
    )}
  </div>
);

/** Odometer, distance this year and this year's costs in one hairline panel. */
export const StatsPanel = ({ overview }: { overview: Overview }) => {
  const { t } = useTranslation("garage");
  const format = useFormat();
  const latest = overview.latestOdometer;

  const amount = (values: Overview["maintenanceThisYear"]) =>
    values.length === 0 ? t("overview.nothingSpent") : format.totals(values);

  return (
    <section className="bg-divider grid grid-cols-2 gap-px overflow-hidden rounded-lg border md:grid-cols-4">
      <Stat
        hint={
          latest === null
            ? undefined
            : t("overview.loggedOn", { date: format.date(latest.date) })
        }
        label={t("overview.odometer")}
        value={
          latest === null ? t("cars.noOdometer") : format.distance(latest.km)
        }
      />
      <Stat
        label={t("overview.thisYear")}
        value={format.distance(overview.kmThisYear)}
      />
      <Stat
        label={t("overview.maintenance")}
        value={amount(overview.maintenanceThisYear)}
      />
      <Stat
        label={t("overview.otherCosts")}
        value={amount(overview.expensesThisYear)}
      />
    </section>
  );
};
