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
import { useFormat } from "@/lib/format";
import { cn } from "@/lib/utils";

import { CompleteReminderButton } from "../reminders/complete-reminder-button";
import type { ActiveReminder } from "../reminders/reminders.queries";
import type { VisitListItem } from "../visits/visits.queries";
import type { CarTab } from "./car-tabs";
import { describeDue } from "./describe-due";

const ROWS = 5;

const ViewAll = ({
  carId,
  mobileLabel,
  tab,
}: {
  carId: string;
  mobileLabel: string;
  tab: CarTab;
}) => {
  const { t } = useTranslation("garage");

  return (
    <Link
      className="text-primary md:text-muted-foreground md:hover:text-foreground text-sm font-medium md:text-xs md:font-normal"
      params={{ carId }}
      search={{ tab }}
      to="/garage/cars/$carId"
    >
      <span className="md:hidden">{mobileLabel}</span>
      <span className="hidden md:inline">{t("overview.viewAll")}</span>
    </Link>
  );
};

/** Two titles: the phone one and the desktop band one. */
const Title = ({ desktop, mobile }: { desktop: string; mobile: string }) => (
  <>
    <span className="md:hidden">{mobile}</span>
    <span className="hidden md:inline">{desktop}</span>
  </>
);

const useIntervalText = () => {
  const { t } = useTranslation("garage");
  const format = useFormat();

  const monthsText = (months: number | null): string | null => {
    if (months === null) {
      return null;
    }

    return months % 12 === 0
      ? t("overview.years", { count: months / 12 })
      : t("overview.months", { count: months });
  };

  return (reminder: ActiveReminder): string | null => {
    const parts = [
      monthsText(reminder.intervalMonths),
      reminder.intervalKm === null
        ? null
        : format.distance(reminder.intervalKm),
    ].filter((part) => part !== null);

    return parts.length === 0
      ? null
      : t("overview.every", { interval: parts.join(" / ") });
  };
};

/** Phones: "Due next" with check circles. Desktop: "Reminders" band rows. */
export const CarReminders = ({
  carId,
  readOnly,
  reminders,
}: {
  carId: string;
  readOnly: boolean;
  reminders: ActiveReminder[];
}) => {
  const { t } = useTranslation("garage");
  const { t: tc } = useTranslation();
  const format = useFormat();
  const intervalText = useIntervalText();
  const shown = reminders.slice(0, ROWS);

  return (
    <ListSection
      action={
        <ViewAll
          carId={carId}
          mobileLabel={t("overview.all")}
          tab="reminders"
        />
      }
      count={reminders.length}
      title={
        <Title
          desktop={t("overview.remindersTitle")}
          mobile={t("overview.dueNextShort")}
        />
      }
    >
      {shown.length === 0 ? (
        <ListRow className="text-muted-foreground">
          {t("overview.nothingDue")}
        </ListRow>
      ) : (
        shown.map((reminder) => {
          const due = describeDue(reminder, format, tc);
          const tone = STATUS_TEXT_TONE[reminder.status];

          return (
            <ListRow className="pr-1 md:pr-5" key={reminder.id}>
              <StatusRing
                progress={reminderProgress(reminder)}
                status={reminder.status}
              />
              <ListRowText
                meta={
                  <>
                    <span className={cn("tabular-nums md:hidden", tone)}>
                      {due}
                    </span>
                    <span className="hidden md:inline">
                      {intervalText(reminder)}
                    </span>
                  </>
                }
                title={reminder.title}
              />
              {!readOnly && (
                <span className="hidden md:flex">
                  <CompleteReminderButton
                    carId={carId}
                    reminder={reminder}
                    variant="hover"
                  />
                </span>
              )}
              <span
                className={cn(
                  "hidden w-28 shrink-0 text-right tabular-nums md:block",
                  tone,
                  reminder.status !== "upcoming" && "font-medium"
                )}
              >
                {due}
              </span>
              {!readOnly && (
                <span className="md:hidden">
                  <CompleteReminderButton
                    carId={carId}
                    reminder={reminder}
                    variant="circle"
                  />
                </span>
              )}
            </ListRow>
          );
        })
      )}
    </ListSection>
  );
};

/** Phones: "Last done". Desktop: "History" band with date, odometer and cost columns. */
export const CarHistory = ({
  carId,
  visits,
}: {
  carId: string;
  visits: VisitListItem[];
}) => {
  const { t } = useTranslation("garage");
  const format = useFormat();

  return (
    <ListSection
      action={
        <ViewAll
          carId={carId}
          mobileLabel={t("overview.historyTitle")}
          tab="history"
        />
      }
      count={visits.length}
      title={
        <Title
          desktop={t("overview.historyTitle")}
          mobile={t("overview.lastDoneShort")}
        />
      }
    >
      {visits.length === 0 ? (
        <ListRow className="text-muted-foreground">
          {t("overview.noHistory")}
        </ListRow>
      ) : (
        visits.slice(0, ROWS).map((visit) => {
          const date = format.date(visit.date, visit.datePrecision);

          const km =
            visit.odometerKm === null
              ? null
              : format.distance(visit.odometerKm);

          return (
            <ListRow asChild key={visit.id}>
              <Link
                params={{ carId, visitId: visit.id }}
                to="/garage/cars/$carId/services/$visitId"
              >
                <StatusRing label={null} status="done" />
                <ListRowText
                  meta={
                    <span className="tabular-nums md:hidden">
                      {[date, km].filter((part) => part !== null).join(" · ")}
                    </span>
                  }
                  title={visit.items.map((item) => item.label).join(", ")}
                />
                <span className="text-muted-foreground hidden w-24 shrink-0 tabular-nums md:block">
                  {date}
                </span>
                <span className="text-muted-foreground hidden w-24 shrink-0 text-right tabular-nums md:block">
                  {km}
                </span>
                <span className="w-16 shrink-0 text-right font-medium tabular-nums">
                  {visit.effectiveTotalMinor === null
                    ? null
                    : format.money(visit.effectiveTotalMinor, visit.currency)}
                </span>
              </Link>
            </ListRow>
          );
        })
      )}
    </ListSection>
  );
};
