import { z } from "zod";

import { APP_DIALOGS } from "@/app/dialogs";
import type { CarShortcutAction } from "@/lib/shortcuts";

export const ENTRY_DIALOGS = ["car", "service", "expense", "reminder"] as const;

export type EntryDialogKind = (typeof ENTRY_DIALOGS)[number];

const optionalId = z.string().min(1).optional().catch(undefined);

/**
 * Create/edit forms open as dialogs over the current page. Their state lives in
 * the URL (`?dialog=expense&car=…&id=…`), so links, refresh and Back work.
 * - `car`: the car the entry belongs to (for `dialog=car`, the car being edited).
 * - `id`: the entry being edited; absent means "create".
 * - `reminder`: the reminder a new service or expense completes.
 */
export const entryDialogSearchSchema = z.object({
  car: optionalId,
  // Any app dialog parses, so Finances dialogs survive; the garage host only opens its own.
  dialog: z.enum(APP_DIALOGS).optional().catch(undefined),
  id: optionalId,
  reminder: optionalId,
});

export type EntryDialogSearch = z.infer<typeof entryDialogSearchSchema>;

export type EntryDialogTarget =
  | { dialog: "car"; car?: string }
  | {
      dialog: "service" | "expense";
      car: string;
      id?: string;
      reminder?: string;
    }
  | { dialog: "reminder"; car: string; id?: string };

/** The given search without any entry dialog keys, so the dialog closes. */
export const withoutEntryDialog = <T extends EntryDialogSearch>(
  search: T
): Omit<T, keyof EntryDialogSearch> => {
  const {
    car: _car,
    dialog: _dialog,
    id: _id,
    reminder: _reminder,
    ...rest
  } = search;

  return rest;
};

/** The dialog each car shortcut (S / E / R) opens; L opens the odometer dialog instead. */
export const DIALOG_FOR_CAR_ACTION = {
  addExpense: "expense",
  addReminder: "reminder",
  addService: "service",
} as const satisfies Record<
  Exclude<CarShortcutAction, "logOdometer">,
  EntryDialogKind
>;
