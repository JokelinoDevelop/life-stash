import { isIsoDate } from "@shared/domain/dates";
import { z } from "zod";

import type { AppDialog } from "@/app/dialogs";

export const FITNESS_DIALOGS = [
  "training",
  "session",
  "weight",
] as const satisfies readonly AppDialog[];

export type FitnessDialogKind = (typeof FITNESS_DIALOGS)[number];

const optionalId = z.string().min(1).optional().catch(undefined);

const optionalDate = z.string().refine(isIsoDate).optional().catch(undefined);

/**
 * Fitness search keys next to `dialog` and `id` (shared with Garage and Finances):
 * - `schedule` + `date`: one occurrence of a weekly repeat (`date` is the day it stands for).
 * - `date` alone: the day a new session or weight entry is for.
 */
export const fitnessDialogSearchFields = {
  date: optionalDate,
  schedule: optionalId,
};

export type FitnessDialogTarget =
  | { dialog: "training"; id?: string }
  | { dialog: "session"; id?: string; schedule?: string; date?: string }
  | { dialog: "weight"; date?: string };

export interface FitnessDialogSearch {
  dialog?: AppDialog;
  id?: string;
  schedule?: string;
  date?: string;
}

export const isFitnessDialog = (
  dialog: AppDialog | undefined
): dialog is FitnessDialogKind =>
  FITNESS_DIALOGS.some((name) => name === dialog);

/** The given search without any fitness dialog keys, so the dialog closes. */
export const withoutFitnessDialog = <T extends FitnessDialogSearch>(
  search: T
): Omit<T, keyof FitnessDialogSearch> => {
  const {
    date: _date,
    dialog: _dialog,
    id: _id,
    schedule: _schedule,
    ...rest
  } = search;

  return rest;
};
