import type { TimelineFilter } from "../timeline/build-timeline";

export const CAR_TABS = [
  "overview",
  "timeline",
  "reminders",
  "details",
] as const;

export type CarTab = (typeof CAR_TABS)[number];

/** Tabs that were merged into Timeline and Details. */
export const LEGACY_TAB_NAMES = [
  "history",
  "mileage",
  "expenses",
  "spending",
] as const;

type LegacyTab = (typeof LEGACY_TAB_NAMES)[number];

interface LegacyTarget {
  tab: CarTab;
  show?: TimelineFilter;
}

const LEGACY_TARGETS = {
  expenses: { show: "expenses", tab: "timeline" },
  history: { show: "services", tab: "timeline" },
  mileage: { show: "odometer", tab: "timeline" },
  spending: { tab: "details" },
} as const satisfies Record<LegacyTab, LegacyTarget>;

/**
 * Where an old tab now lives, so old links and push notifications
 * (`?tab=mileage&log=1`) still land in the right place.
 */
export const legacyCarTab = (tab: string): LegacyTarget | undefined => {
  const name = LEGACY_TAB_NAMES.find((legacy) => legacy === tab);

  return name === undefined ? undefined : LEGACY_TARGETS[name];
};
