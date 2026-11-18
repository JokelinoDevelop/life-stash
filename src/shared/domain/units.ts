export const DISTANCE_UNITS = ["km", "mi"] as const;

export type DistanceUnit = (typeof DISTANCE_UNITS)[number];

const KM_PER_MILE = 1.609344;

/** Converts a stored km value to the user's display unit (rounded to whole units). */
export const kmToDisplay = (km: number, unit: DistanceUnit): number =>
  unit === "km" ? Math.round(km) : Math.round(km / KM_PER_MILE);

/** Converts a value typed in the user's unit to whole km for storage. */
export const displayToKm = (value: number, unit: DistanceUnit): number =>
  unit === "km" ? Math.round(value) : Math.round(value * KM_PER_MILE);
