export const REMINDER_KINDS = [
  "service",
  "insurance",
  "registration",
  "other",
] as const;

export type ReminderKind = (typeof REMINDER_KINDS)[number];

export const VISIT_KINDS = ["maintenance", "repair"] as const;

export type VisitKind = (typeof VISIT_KINDS)[number];

export const EXPENSE_CATEGORIES = [
  "fuel",
  "insurance",
  "registration",
  "tolls",
  "parking",
  "other",
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

/** Reminder kinds that are completed by logging an expense instead of a service visit. */
export const EXPENSE_REMINDER_KINDS: readonly ReminderKind[] = [
  "insurance",
  "registration",
];
