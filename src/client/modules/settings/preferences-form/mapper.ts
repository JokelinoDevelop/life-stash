import type { InferRequestType } from "hono/client";

import type { api, SuccessBody } from "@/lib/api";

export type Preferences = SuccessBody<
  Awaited<ReturnType<typeof api.settings.preferences.$get>>
>;

export type UpdatePreferencesBody = InferRequestType<
  typeof api.settings.preferences.$put
>["json"];

export type PreferencesPatch = Partial<UpdatePreferencesBody>;

/** The full PUT body: the current preferences with one change applied (rows save one at a time). */
export const preferencesToRequest = (
  current: Preferences,
  patch: PreferencesPatch
): UpdatePreferencesBody => ({
  currency: patch.currency ?? current.currency,
  displayName: (patch.displayName ?? current.displayName).trim(),
  distanceUnit: patch.distanceUnit ?? current.distanceUnit,
  locale: patch.locale ?? current.locale,
  odometerNudgeWeeks: patch.odometerNudgeWeeks ?? current.odometerNudgeWeeks,
  timeZone: patch.timeZone ?? current.timeZone,
});

/** What a patch would undo: the current values of the fields it changes. */
export const undoPatch = (
  current: Preferences,
  patch: PreferencesPatch
): PreferencesPatch => {
  const full = preferencesToRequest(current, {});
  const undo: PreferencesPatch = {};

  if (patch.currency !== undefined) {
    undo.currency = full.currency;
  }

  if (patch.displayName !== undefined) {
    undo.displayName = full.displayName;
  }

  if (patch.distanceUnit !== undefined) {
    undo.distanceUnit = full.distanceUnit;
  }

  if (patch.locale !== undefined) {
    undo.locale = full.locale;
  }

  if (patch.odometerNudgeWeeks !== undefined) {
    undo.odometerNudgeWeeks = full.odometerNudgeWeeks;
  }

  if (patch.timeZone !== undefined) {
    undo.timeZone = full.timeZone;
  }

  return undo;
};
