/**
 * Every create/edit dialog the `_app` route can open via `?dialog=…`. Garage, Finances and Fitness
 * each render their own; a host ignores names it doesn't own.
 */
export const APP_DIALOGS = [
  "car",
  "service",
  "expense",
  "reminder",
  "transaction",
  "category",
  "invoice",
  "client",
  "mark-paid",
  "recurring",
  "project",
  "training",
  "session",
  "weight",
] as const;

export type AppDialog = (typeof APP_DIALOGS)[number];
