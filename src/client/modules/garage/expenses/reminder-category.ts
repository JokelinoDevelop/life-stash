import type {
  ExpenseCategory,
  ReminderKind,
} from "@shared/domain/garage-kinds";

/** Category to prefill when an expense completes a reminder of the given kind. */
export const categoryForReminder = (
  kind: ReminderKind | undefined
): ExpenseCategory => {
  if (kind === "insurance" || kind === "registration") {
    return kind;
  }

  return kind === undefined ? "fuel" : "other";
};
