export const CAR_TABS = [
  "overview",
  "history",
  "reminders",
  "mileage",
  "expenses",
  "spending",
  "details",
] as const;

export type CarTab = (typeof CAR_TABS)[number];
