/** Demo Fitness data for the account holder (Fitness is personal, so only they get it). */

export interface TrainingFixture {
  name: string;
  description: string | null;
  durationMinutes: number | null;
  /** ISO weekdays it repeats on (empty: no weekly repeat). */
  weekdays: readonly number[];
}

export const TRAININGS: readonly TrainingFixture[] = [
  {
    description: "Squats, Romanian deadlifts, lunges, calf raises",
    durationMinutes: 60,
    name: "Leg day",
    weekdays: [1, 4],
  },
  {
    description: "Bench press, rows, overhead press, pull-ups",
    durationMinutes: 50,
    name: "Upper body",
    weekdays: [],
  },
  {
    description: "Hips, shoulders and thoracic spine, 20 minutes",
    durationMinutes: 20,
    name: "Mobility",
    weekdays: [],
  },
];

/** How many weeks of history the weekly repeat has. */
export const HISTORY_WEEKS = 8;

/** Weeks back (1 = last week) where one Leg day was left untouched, so it shows as missed. */
export const MISSED_WEEKS_AGO: readonly number[] = [4, 7];

/** Weeks back where one Leg day was skipped, with a reason. */
export const SKIPPED_WEEKS_AGO: readonly number[] = [3];

export const SKIP_NOTES: readonly string[] = ["Travelling", "Sore knee"];

/** The working weight for squats grows by this much each week. */
export const SQUAT_START_KG = 80;
export const SQUAT_STEP_KG = 2.5;

export const RUN_NOTES: readonly string[] = [
  "Easy 5 km along the Vardar",
  "Intervals 6×400 m",
  "Long run, 9 km",
];

/** Body weight: about 60 entries over the last 90 days, drifting down with daily noise. */
export const WEIGHT = {
  days: 90,
  entries: 60,
  endKg: 81.2,
  noiseKg: 0.4,
  startKg: 84.3,
} as const;
