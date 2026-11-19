import { addDays, addMonths } from "../dates";

/** This month's date for a template that repeats on `dayOfMonth` (clamped to the month's end). */
export const recurringDate = (dayOfMonth: number, month: string): string => {
  const first = `${month}-01`;
  const lastDay = Number(addDays(addMonths(first, 1), -1).slice(8, 10));
  const day = Math.min(Math.max(1, dayOfMonth), lastDay);

  return `${month}-${String(day).padStart(2, "0")}`;
};

export interface RecurringTemplate {
  id: string;
  active: boolean;
  dayOfMonth: number;
  lastHandledMonth: string | null;
}

/**
 * Templates to confirm or skip this month: active ones not yet handled in `today`'s month.
 * Each comes with this month's date. Nothing is booked by itself.
 */
export const pendingRecurring = <T extends RecurringTemplate>(
  templates: readonly T[],
  today: string
): (T & { dueDate: string })[] => {
  const month = today.slice(0, 7);

  const pending: (T & { dueDate: string })[] = [];

  for (const template of templates) {
    if (template.active && (template.lastHandledMonth ?? "") < month) {
      pending.push({
        ...template,
        dueDate: recurringDate(template.dayOfMonth, month),
      });
    }
  }

  return pending.toSorted((a, b) => a.dueDate.localeCompare(b.dueDate));
};

/** The date Confirm books: this month's date, or today if that is still ahead. */
export const confirmDate = (dueDate: string, today: string): string =>
  dueDate > today ? today : dueDate;
