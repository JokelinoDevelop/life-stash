import type { DatePrecision } from "@shared/domain/dates";
import type { VisitKind } from "@shared/domain/garage-kinds";
import type { Currency } from "@shared/domain/money";

export interface ListVisitsResponse {
  visits: {
    id: string;
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
    photoCount: number;
    items: {
      id: string;
      itemId: string | null;
      label: string;
      costMinor: number | null;
    }[];
  }[];
}
