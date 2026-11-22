import { formatPartialDate } from "@shared/domain/dates";
import type { ReminderEvaluation } from "@shared/domain/reminders";
import { kmToDisplay } from "@shared/domain/units";

import type { PushMessage } from "../../core/push";
import type { HouseholdPrefs } from "./household-prefs";

const TEXT = {
  en: {
    dueIn: (distance: string) => `Due in ${distance}`,
    dueOn: (date: string) => `Due on ${date}`,
    nudgeBody:
      "Log a fresh odometer reading so mileage reminders stay accurate.",
    nudgeTitle: (car: string) => `Log your odometer for ${car}?`,
    overdue: "Overdue — open LifeStash to see the details.",
  },
  mk: {
    dueIn: (distance: string) => `Рок за ${distance}`,
    dueOn: (date: string) => `Рок на ${date}`,
    nudgeBody: "Внеси нова состојба на километража за точни потсетници.",
    nudgeTitle: (car: string) => `Внеси километража за ${car}?`,
    overdue: "Задоцнето — отвори LifeStash за детали.",
  },
} as const;

export interface ReminderNotice {
  reminderId: string;
  carId: string;
  carName: string;
  title: string;
  dueDate: string | null;
  evaluation: ReminderEvaluation;
}

const describeDue = (prefs: HouseholdPrefs, notice: ReminderNotice): string => {
  const text = TEXT[prefs.locale];

  if (notice.evaluation.status === "overdue") {
    return text.overdue;
  }

  const { kmLeft } = notice.evaluation;

  const kmIsSooner =
    kmLeft !== null &&
    (notice.dueDate === null || (notice.evaluation.daysLeft ?? 0) > 7);

  if (kmIsSooner) {
    const value = kmToDisplay(kmLeft, prefs.distanceUnit);

    return text.dueIn(`${value.toLocaleString("en-US")} ${prefs.distanceUnit}`);
  }

  return notice.dueDate === null
    ? text.overdue
    : text.dueOn(formatPartialDate(notice.dueDate));
};

export const reminderMessage = (
  prefs: HouseholdPrefs,
  notice: ReminderNotice
): PushMessage => ({
  body: describeDue(prefs, notice),
  tag: `reminder-${notice.reminderId}`,
  title: `${notice.carName}: ${notice.title}`,
  url: `/garage/cars/${notice.carId}?tab=reminders`,
});

export const odometerNudgeMessage = (
  prefs: HouseholdPrefs,
  car: { id: string; name: string }
): PushMessage => ({
  body: TEXT[prefs.locale].nudgeBody,
  tag: `nudge-${car.id}`,
  title: TEXT[prefs.locale].nudgeTitle(car.name),
  url: `/garage/cars/${car.id}?tab=timeline&log=1`,
});
