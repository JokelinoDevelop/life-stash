import type { ReminderKind } from "@shared/domain/garage-kinds";
import type { ReminderStatus } from "@shared/domain/reminders";

export interface ListRemindersResponse {
  today: string;
  latestOdometerKm: number | null;
  active: {
    id: string;
    kind: ReminderKind;
    title: string;
    dueDate: string | null;
    dueOdometerKm: number | null;
    intervalMonths: number | null;
    intervalKm: number | null;
    notes: string | null;
    notifiedAt: string | null;
    status: ReminderStatus;
    daysLeft: number | null;
    kmLeft: number | null;
  }[];
  completed: {
    id: string;
    kind: ReminderKind;
    title: string;
    completedAt: string;
    completedVisitId: string | null;
    completedExpenseId: string | null;
  }[];
}
