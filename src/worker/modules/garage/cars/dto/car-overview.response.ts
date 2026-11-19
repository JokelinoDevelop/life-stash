import type { DatePrecision } from "@shared/domain/dates";
import type { ReminderKind, VisitKind } from "@shared/domain/garage-kinds";
import type { Currency } from "@shared/domain/money";
import type { ReminderStatus } from "@shared/domain/reminders";

export interface CarOverviewResponse {
  today: string;
  latestOdometer: { km: number; date: string } | null;
  kmThisYear: number;
  dueReminders: {
    id: string;
    title: string;
    kind: ReminderKind;
    dueDate: string | null;
    dueOdometerKm: number | null;
    intervalKm: number | null;
    intervalMonths: number | null;
    status: ReminderStatus;
    daysLeft: number | null;
    kmLeft: number | null;
  }[];
  recentVisits: {
    id: string;
    date: string;
    datePrecision: DatePrecision;
    kind: VisitKind;
    odometerKm: number | null;
    byPreviousOwner: boolean;
    items: string[];
  }[];
  maintenanceThisYear: {
    currency: Currency;
    amountMinor: number;
  }[];
  expensesThisYear: { currency: Currency; amountMinor: number }[];
}
