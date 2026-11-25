import type { DatePrecision } from "@shared/domain/dates";
import type { ExpenseCategory, VisitKind } from "@shared/domain/garage-kinds";
import type { Currency } from "@shared/domain/money";

/**
 * Fixture vocabulary. Fixtures describe *habits and plans* relative to today, and the seeders
 * turn them into dated records, so the demo data never goes stale.
 *
 * Money is written in major units (1250 = 1,250.00) and converted when inserted.
 */

/** The values the car form offers. */
const FUEL_TYPES = [
  "petrol",
  "diesel",
  "lpg",
  "hybrid",
  "electric",
  "other",
] as const;

export interface Money {
  amount: number;
  currency: Currency;
}

/** A visit line with its own cost. Plain names (`items: [...]`) are priced from `prices.ts` instead. */
export interface CustomLine {
  label: string;
  cost?: number | null;
  notes?: string;
}

/** A recurring job, e.g. the yearly oil service. Generates the visit history and its reminder. */
export interface MaintenancePlan {
  /** The reminder's title. */
  title: string;
  /** The lines each round logs, priced from `prices.ts`. */
  items: string[];
  everyMonths: number;
  everyKm?: number;
  /** When the next one is due, in days from the end of ownership (today for active cars). */
  nextDueInDays: number;
  shop: string;
  labour: number;
}

/** A single visit, e.g. a repair. */
export interface OneOffVisit {
  monthsAgo: number;
  kind: VisitKind;
  /** Line names, priced from `prices.ts`. */
  items?: string[];
  custom?: CustomLine[];
  shop?: string;
  notes?: string;
  labour?: number;
  /** Defaults to the car's currency. Non-MKD visits need explicit line costs. */
  currency?: Currency;
  /** Leave the invoice total blank, so the app falls back to the sum of line costs. */
  blankTotal?: boolean;
}

/** A visit from the service book, before the household owned the car. */
export interface PreviousOwnerVisit {
  yearsBeforePurchase: number;
  odometerKm: number;
  items: string[];
  notes?: string;
}

/** A yearly payment that is completed by logging an expense (insurance, registration). */
export interface Renewal {
  kind: "insurance" | "registration";
  title: string;
  amount: number;
  /** Days from today until the next renewal. */
  nextDueInDays: number;
  notes?: string;
}

export interface FuelHabit {
  litresPer100Km: number;
  pricePerLitre: number;
  fillEveryKm: number;
  /** Months of fuel history to generate (counted back from the end of ownership). */
  months: number;
  /** Whether fill-ups record the odometer (they then also count as readings). */
  logsOdometer: boolean;
}

/** Small recurring costs: tolls, parking, car washes. */
export interface ExtraExpense {
  category: Exclude<ExpenseCategory, "fuel">;
  amount: number;
  timesPerYear: number;
  notes: string;
}

export interface ReadingHabit {
  everyWeeks: number;
  count: number;
  /** How long ago the most recent reading was taken. */
  lastWeeksAgo: number;
}

/** A reminder that is not part of a plan. */
export interface OneOffReminder {
  kind: "service" | "other";
  title: string;
  dueInDays?: number;
  /** Relative to the car's current odometer. */
  dueInKm?: number;
  notes?: string;
}

export interface CarFixture {
  /** Stable handle for the car within the seed (not stored). */
  key: string;
  details: {
    name: string;
    make: string;
    model: string;
    year: number;
    plate: string;
    vin?: string;
    fuelType: (typeof FUEL_TYPES)[number];
    color: string;
    notes?: string;
  };
  /** Currency of everyday costs on this car. */
  currency: Currency;
  purchase: {
    monthsAgo: number;
    precision: DatePrecision;
    odometerKm: number;
    price?: Money;
  };
  /** Sold cars are archived and get no active reminders. */
  sold?: { monthsAgo: number };
  kmPerYear: number;
  maintenance?: MaintenancePlan[];
  visits?: OneOffVisit[];
  previousOwner?: PreviousOwnerVisit[];
  renewals?: Renewal[];
  fuel?: FuelHabit;
  extras?: ExtraExpense[];
  readings?: ReadingHabit;
  reminders?: OneOffReminder[];
}
