import { reminderHorizon } from "@shared/domain/reminders";
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

import type { CarListItem } from "../cars/car-row";
import { describeDue } from "../cars/describe-due";
import type { HouseholdReminder } from "./household.queries";

export const ReminderRow = ({
  car,
  reminder,
}: {
  car: CarListItem | undefined;
  reminder: HouseholdReminder;
}) => {
  const { t } = useTranslation();
  const format = useFormat();

  return (
    <ListRow
      render={
        <Link
          params={{ carId: reminder.carId }}
          search={{ tab: "reminders" }}
          to="/garage/cars/$carId"
        />
      }
    >
      <StatusRing status={reminder.status} />
      <ListRowText meta={car?.name} title={reminder.title} />
      <span
        className={cn(
          "shrink-0 text-sm font-medium tabular-nums md:font-normal",
          STATUS_TEXT_TONE[reminder.status]
        )}
      >
        {describeDue(reminder, format, t)}
      </span>
    </ListRow>
  );
};

/** Overdue and next-30-day reminders in one list; everything else is on Today. */
export const DueReminders = ({
  cars,
  reminders,
}: {
  cars: readonly CarListItem[];
  reminders: readonly HouseholdReminder[];
}) => {
  const { t } = useTranslation("garage");
  const { t: tc } = useTranslation();

  const urgent = reminders.filter(
    (reminder) => reminderHorizon(reminder) !== "later"
  );

  return (
    <ListSection
      action={
        <Link className="text-primary text-xs font-medium" to="/">
          {tc("nav.today")}
        </Link>
      }
      count={urgent.length}
      title={t("home.reminders")}
    >
      {urgent.length === 0 ? (
        <ListRow className="text-muted-foreground">
          {t("home.allClear")}
        </ListRow>
      ) : (
        urgent.map((reminder) => (
          <ReminderRow
            car={cars.find((car) => car.id === reminder.carId)}
            key={reminder.id}
            reminder={reminder}
          />
        ))
      )}
    </ListSection>
  );
};
