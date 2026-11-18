import type { InferRequestType } from "hono/client";

import type { api, SuccessBody } from "@/lib/api";
import { parseInteger } from "@/lib/form-schemas";

import type { PreferencesFormValues } from "./schema";

type PreferencesResponse = SuccessBody<
  Awaited<ReturnType<typeof api.settings.preferences.$get>>
>;

type UpdatePreferencesBody = InferRequestType<
  typeof api.settings.preferences.$put
>["json"];

const MAX_NUDGE_WEEKS = 52;

export const preferencesToFormValues = (
  prefs: PreferencesResponse
): PreferencesFormValues => ({
  currency: prefs.currency,
  displayName: prefs.displayName,
  distanceUnit: prefs.distanceUnit,
  locale: prefs.locale,
  odometerNudgeWeeks: String(prefs.odometerNudgeWeeks),
  timeZone: prefs.timeZone,
});

export const preferencesFormToRequest = (
  values: PreferencesFormValues
): UpdatePreferencesBody => ({
  currency: values.currency,
  displayName: values.displayName.trim(),
  distanceUnit: values.distanceUnit,
  locale: values.locale,
  odometerNudgeWeeks: Math.min(
    parseInteger(values.odometerNudgeWeeks) ?? 0,
    MAX_NUDGE_WEEKS
  ),
  timeZone: values.timeZone,
});
