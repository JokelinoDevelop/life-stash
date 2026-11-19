import type { ReminderKind } from "@shared/domain/garage-kinds";
import type { Currency } from "@shared/domain/money";
import type { ReminderStatus } from "@shared/domain/reminders";

interface Amount {
  currency: Currency;
  amountMinor: number;
}

export interface HouseholdOverviewResponse {
  householdName: string;
  today: string;
  /** Active reminders of active cars, most urgent first. */
  reminders: {
    id: string;
    carId: string;
    title: string;
    kind: ReminderKind;
    status: ReminderStatus;
    dueDate: string | null;
    dueOdometerKm: number | null;
    daysLeft: number | null;
    kmLeft: number | null;
    intervalKm: number | null;
    intervalMonths: number | null;
  }[];
  /** Spending per active car and month of the current year. */
  months: (Amount & { carId: string; month: string })[];
  spentThisYear: Amount[];
  spentLastYear: Amount[];
  /** Distance driven this year across active cars. */
  kmThisYear: number;
}
