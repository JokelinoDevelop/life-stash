import { addMonths, daysBetween } from "./dates";

/** Date reminders get their heads-up this many days before they are due. */
export const DATE_NOTICE_DAYS = 7;

/** Odometer reminders get their heads-up this many km before they are due. */
export const ODOMETER_NOTICE_KM = 1000;

export const REMINDER_STATUSES = ["overdue", "due-soon", "upcoming"] as const;

export type ReminderStatus = (typeof REMINDER_STATUSES)[number];

export interface ReminderTarget {
  dueDate: string | null;
  dueOdometerKm: number | null;
}

export interface ReminderContext {
  today: string;
  latestOdometerKm: number | null;
}

export interface ReminderEvaluation {
  status: ReminderStatus;
  daysLeft: number | null;
  kmLeft: number | null;
}

const STATUS_RANK: Record<ReminderStatus, number> = {
  "due-soon": 1,
  overdue: 0,
  upcoming: 2,
};

const statusFor = (
  left: number | null,
  notice: number
): ReminderStatus | null => {
  if (left === null) {
    return null;
  }

  if (left <= 0) {
    return "overdue";
  }

  return left <= notice ? "due-soon" : "upcoming";
};

/** Evaluates a reminder; with both targets set, whichever comes first wins. */
export const evaluateReminder = (
  target: ReminderTarget,
  context: ReminderContext
): ReminderEvaluation => {
  const daysLeft =
    target.dueDate === null ? null : daysBetween(context.today, target.dueDate);

  const kmLeft =
    target.dueOdometerKm === null || context.latestOdometerKm === null
      ? null
      : target.dueOdometerKm - context.latestOdometerKm;

  const candidates = [
    statusFor(daysLeft, DATE_NOTICE_DAYS),
    statusFor(kmLeft, ODOMETER_NOTICE_KM),
  ]
    .filter((status): status is ReminderStatus => status !== null)
    .toSorted((a, b) => STATUS_RANK[a] - STATUS_RANK[b]);

  return { daysLeft, kmLeft, status: candidates[0] ?? "upcoming" };
};

/** True when a reminder should get its (single) heads-up now. */
export const needsHeadsUp = (
  target: ReminderTarget,
  context: ReminderContext
): boolean => evaluateReminder(target, context).status !== "upcoming";

/** Sort helper: most urgent first, then soonest date, then smallest km left. */
export const compareByUrgency = (
  a: ReminderEvaluation,
  b: ReminderEvaluation
): number => {
  const rank = STATUS_RANK[a.status] - STATUS_RANK[b.status];

  if (rank !== 0) {
    return rank;
  }

  const days =
    (a.daysLeft ?? Number.POSITIVE_INFINITY) -
    (b.daysLeft ?? Number.POSITIVE_INFINITY);

  if (days !== 0 && Number.isFinite(days)) {
    return days;
  }

  return (
    (a.kmLeft ?? Number.POSITIVE_INFINITY) -
    (b.kmLeft ?? Number.POSITIVE_INFINITY)
  );
};

export interface RecurrenceInput {
  intervalMonths: number | null;
  intervalKm: number | null;
  previous: ReminderTarget;
  completedOn: string;
  completedAtKm: number | null;
}

/** Computes the next reminder's targets after completion, or null when it does not recur. */
export const nextRecurrence = (
  input: RecurrenceInput
): ReminderTarget | null => {
  if (input.intervalMonths === null && input.intervalKm === null) {
    return null;
  }

  const dueDate =
    input.intervalMonths === null
      ? null
      : addMonths(input.completedOn, input.intervalMonths);

  const baseKm = input.completedAtKm ?? input.previous.dueOdometerKm;

  const dueOdometerKm =
    input.intervalKm === null || baseKm === null
      ? null
      : baseKm + input.intervalKm;

  if (dueDate === null && dueOdometerKm === null) {
    return null;
  }

  return { dueDate, dueOdometerKm };
};
