import { sumByCurrency } from "@shared/domain/money";
import type { MoneyTotal } from "@shared/domain/money";
import { NEXT_HORIZON_DAYS, reminderHorizon } from "@shared/domain/reminders";
import type {
  ReminderEvaluation,
  ReminderHorizon,
} from "@shared/domain/reminders";

/** An unpaid, sent invoice as the Today page needs it. */
export interface DueInvoice {
  id: string;
  dueDate: string;
  status: string;
}

export type TodayItem<R, I> =
  | { kind: "reminder"; reminder: R; sortKey: number }
  | { kind: "invoice"; invoice: I; sortKey: number };

const DAY_MS = 86_400_000;

/** Whole days from `today` to `date` (negative when past). */
export const daysUntil = (date: string, today: string): number =>
  Math.round((Date.parse(date) - Date.parse(today)) / DAY_MS);

/** Overdue invoices count as overdue; the rest by how soon they are due. */
export const invoiceHorizon = (
  invoice: DueInvoice,
  today: string
): ReminderHorizon => {
  const days = daysUntil(invoice.dueDate, today);

  if (invoice.status === "overdue" || days < 0) {
    return "overdue";
  }

  return days <= NEXT_HORIZON_DAYS ? "next30" : "later";
};

/** Reminders without a due date (odometer-only) sort after dated ones. */
const UNDATED = Number.MAX_SAFE_INTEGER;

/**
 * Reminders and unpaid invoices together, grouped as Overdue / Next 30 days /
 * Later and sorted by days left within each group.
 */
export const groupTodayItems = <
  R extends ReminderEvaluation,
  I extends DueInvoice,
>(
  reminders: readonly R[],
  invoices: readonly I[],
  today: string
): Map<ReminderHorizon, TodayItem<R, I>[]> => {
  const groups = new Map<ReminderHorizon, TodayItem<R, I>[]>();

  const add = (horizon: ReminderHorizon, item: TodayItem<R, I>) => {
    groups.set(horizon, [...(groups.get(horizon) ?? []), item]);
  };

  for (const entry of reminders) {
    add(reminderHorizon(entry), {
      kind: "reminder",
      reminder: entry,
      sortKey: entry.daysLeft ?? UNDATED,
    });
  }

  for (const entry of invoices) {
    add(invoiceHorizon(entry, today), {
      invoice: entry,
      kind: "invoice",
      sortKey: daysUntil(entry.dueDate, today),
    });
  }

  for (const items of groups.values()) {
    items.sort((a, b) => a.sortKey - b.sortKey);
  }

  return groups;
};

/** The line under Today's title: how much is overdue and how much money is owed. */
export interface TodaySummary {
  /** Overdue reminders plus overdue invoices. */
  overdue: number;
  /** Everything else that needs action now (due-soon reminders, invoices due within 30 days). */
  dueSoon: number;
  /** Unpaid invoices, per currency. */
  waiting: MoneyTotal[];
}

export const summarizeToday = (
  reminders: readonly ReminderEvaluation[],
  invoices: readonly (DueInvoice & MoneyTotal)[],
  today: string
): TodaySummary => {
  let overdue = 0;
  let dueSoon = 0;

  for (const entry of reminders) {
    const horizon = reminderHorizon(entry);
    overdue += horizon === "overdue" ? 1 : 0;
    dueSoon += horizon === "next30" ? 1 : 0;
  }

  for (const entry of invoices) {
    const horizon = invoiceHorizon(entry, today);
    overdue += horizon === "overdue" ? 1 : 0;
    dueSoon += horizon === "next30" ? 1 : 0;
  }

  return { dueSoon, overdue, waiting: sumByCurrency(invoices) };
};
