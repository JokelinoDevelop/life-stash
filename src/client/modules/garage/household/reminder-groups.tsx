import {
  REMINDER_HORIZONS,
  reminderHorizon,
  reminderProgress,
} from "@shared/domain/reminders";
import type { ReminderHorizon } from "@shared/domain/reminders";
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

import { CarMonogram } from "../cars/car-monogram";
import type { CarListItem } from "../cars/car-row";
import { describeDue } from "../cars/describe-due";
import type { HouseholdReminder } from "./household.queries";

const ReminderRow = ({
  car,
  reminder,
}: {
  car: CarListItem | undefined;
  reminder: HouseholdReminder;
}) => {
  const { t } = useTranslation();
  const format = useFormat();

  return (
    <ListRow asChild>
      <Link
        params={{ carId: reminder.carId }}
        search={{ tab: "reminders" }}
        to="/garage/cars/$carId"
      >
        <StatusRing
          progress={reminderProgress(reminder)}
          status={reminder.status}
        />
        <ListRowText
          meta={
            car === undefined ? undefined : (
              <span className="inline-flex items-center gap-1.5">
                <CarMonogram
                  className="hidden md:flex"
                  name={car.name}
                  size="xs"
                />
                {car.name}
              </span>
            )
          }
          title={reminder.title}
        />
        <span
          className={cn(
            "shrink-0 text-sm font-medium tabular-nums md:font-normal",
            STATUS_TEXT_TONE[reminder.status]
          )}
        >
          {describeDue(reminder, format, t)}
        </span>
      </Link>
    </ListRow>
  );
};

const byHorizon = (reminders: readonly HouseholdReminder[]) => {
  const groups = new Map<ReminderHorizon, HouseholdReminder[]>();

  for (const reminder of reminders) {
    const horizon = reminderHorizon(reminder);
    groups.set(horizon, [...(groups.get(horizon) ?? []), reminder]);
  }

  return groups;
};

/** Reminders across the household as Overdue / Next 30 days / Later groups. */
export const ReminderGroups = ({
  cars,
  horizons = REMINDER_HORIZONS,
  reminders,
}: {
  cars: readonly CarListItem[];
  horizons?: readonly ReminderHorizon[];
  reminders: readonly HouseholdReminder[];
}) => {
  const { t } = useTranslation("garage");
  const groups = byHorizon(reminders);

  return (
    <>
      {horizons.map((horizon) => {
        const group = groups.get(horizon) ?? [];

        return group.length === 0 ? null : (
          <ListSection
            count={group.length}
            key={horizon}
            title={t(`home.horizons.${horizon}`)}
          >
            {group.map((reminder) => (
              <ReminderRow
                car={cars.find((car) => car.id === reminder.carId)}
                key={reminder.id}
                reminder={reminder}
              />
            ))}
          </ListSection>
        );
      })}
    </>
  );
};

/** Phones: overdue and next-30-day reminders in one "Needs attention" list. */
export const NeedsAttention = ({
  cars,
  reminders,
}: {
  cars: readonly CarListItem[];
  reminders: readonly HouseholdReminder[];
}) => {
  const { t } = useTranslation("garage");

  const urgent = reminders.filter(
    (reminder) => reminderHorizon(reminder) !== "later"
  );

  return (
    <ListSection count={urgent.length} title={t("home.needsAttention")}>
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
