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

/** Average month length, used only to turn an interval in months into days. */
const DAYS_PER_MONTH = 30.44;

/** Fallback fill for reminders without an interval (one-off targets). */
const FALLBACK_PROGRESS: Record<ReminderStatus, number> = {
  "due-soon": 0.9,
  overdue: 1,
  upcoming: 0.25,
};

export interface ReminderProgressInput extends ReminderEvaluation {
  intervalMonths: number | null;
  intervalKm: number | null;
}

const usedShare = (left: number | null, interval: number | null) =>
  left === null || interval === null || interval <= 0
    ? null
    : 1 - left / interval;

/**
 * How much of the interval has been used, 0–1, for the status ring.
 * With both a date and a km interval, the one further along wins.
 */
export const reminderProgress = (input: ReminderProgressInput): number => {
  if (input.status === "overdue") {
    return 1;
  }

  const shares = [
    usedShare(
      input.daysLeft,
      input.intervalMonths === null
        ? null
        : input.intervalMonths * DAYS_PER_MONTH
    ),
    usedShare(input.kmLeft, input.intervalKm),
  ].filter((share): share is number => share !== null);

  if (shares.length === 0) {
    return FALLBACK_PROGRESS[input.status];
  }

  return Math.min(1, Math.max(0, ...shares));
};

export const REMINDER_HORIZONS = ["overdue", "next30", "later"] as const;

export type ReminderHorizon = (typeof REMINDER_HORIZONS)[number];

/** Days ahead that count as "next 30 days" on the household overview. */
export const NEXT_HORIZON_DAYS = 30;

/** Overdue, due within 30 days (or due soon by km), or later. */
export const reminderHorizon = (
  evaluation: ReminderEvaluation
): ReminderHorizon => {
  if (evaluation.status === "overdue") {
    return "overdue";
  }

  if (
    evaluation.status === "due-soon" ||
    (evaluation.daysLeft !== null && evaluation.daysLeft <= NEXT_HORIZON_DAYS)
  ) {
    return "next30";
  }

  return "later";
};
