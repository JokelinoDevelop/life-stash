import { CURRENCIES } from "@shared/domain/money";
import { DISTANCE_UNITS } from "@shared/domain/units";
import { z } from "zod";

const isTimeZone = (value: string): boolean => {
  try {
    new Intl.DateTimeFormat("en", { timeZone: value }).format();

    return true;
  } catch {
    return false;
  }
};

export const updatePreferencesRequest = z.object({
  currency: z.enum(CURRENCIES),
  displayName: z.string().trim().min(1).max(60),
  distanceUnit: z.enum(DISTANCE_UNITS),
  locale: z.enum(["en", "mk"]),
  odometerNudgeWeeks: z.number().int().min(0).max(52),
  timeZone: z
    .string()
    .min(1)
    .max(64)
    .refine(isTimeZone, { message: "Unknown time zone" }),
});
