/** Single-key shortcuts, shared by the ⌘K menu, the pages that bind them and button hints. */
export const CAR_SHORTCUTS = {
  addExpense: "e",
  addReminder: "r",
  addService: "s",
  logOdometer: "l",
} as const;

export type CarShortcutAction = keyof typeof CAR_SHORTCUTS;

export const ADD_CAR_SHORTCUT = "c";

/** Service catalog page. */
export const CATALOG_SHORTCUTS = {
  newItem: "n",
  newPackage: "p",
} as const;
