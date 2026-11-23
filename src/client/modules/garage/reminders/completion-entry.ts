import { EXPENSE_REMINDER_KINDS } from "@shared/domain/garage-kinds";
import type { ReminderKind } from "@shared/domain/garage-kinds";

/** The entry that completes a reminder: an expense for insurance/registration, else a service. */
export const completionEntry = (
  carId: string,
  reminder: { id: string; kind: ReminderKind }
) =>
  ({
    car: carId,
    dialog: EXPENSE_REMINDER_KINDS.includes(reminder.kind)
      ? "expense"
      : "service",
    reminder: reminder.id,
  }) as const;
