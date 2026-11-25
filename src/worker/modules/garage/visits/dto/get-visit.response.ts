import type { DatePrecision } from "@shared/domain/dates";
import type { VisitKind } from "@shared/domain/garage-kinds";
import type { Currency } from "@shared/domain/money";

export interface GetVisitResponse {
  visit: {
    id: string;
    carId: string;
    date: string;
    datePrecision: DatePrecision;
    odometerKm: number | null;
    totalMinor: number | null;
    effectiveTotalMinor: number | null;
    currency: Currency;
    kind: VisitKind;
    byPreviousOwner: boolean;
    shop: string | null;
    notes: string | null;
    createdAt: string;
    items: {
      id: string;
      label: string;
      costMinor: number | null;
    }[];
  };
}
