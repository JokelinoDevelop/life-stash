import type { Currency } from "@shared/domain/money";
import type { DistanceUnit } from "@shared/domain/units";

export interface GetPreferencesResponse {
  displayName: string;
  locale: "en" | "mk";
  distanceUnit: DistanceUnit;
  currency: Currency;
  timeZone: string;
  odometerNudgeWeeks: number;
}
