import type { ReminderStatus } from "@shared/domain/reminders";

export interface CarListItemDto {
  id: string;
  name: string;
  make: string | null;
  model: string | null;
  year: number | null;
  plate: string | null;
  archivedAt: string | null;
  latestOdometerKm: number | null;
  overdueCount: number;
  dueSoonCount: number;
  nextReminder: {
    title: string;
    status: ReminderStatus;
    dueDate: string | null;
    dueOdometerKm: number | null;
    kmLeft: number | null;
    daysLeft: number | null;
  } | null;
}

export interface ListCarsResponse {
  cars: CarListItemDto[];
}
