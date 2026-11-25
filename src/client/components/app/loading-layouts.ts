import type { PanelKind } from "./page-skeleton";

interface LoadingLayout {
  chips?: boolean;
  description?: boolean;
  panels?: PanelKind[];
  rows?: number;
  sections?: number;
}

/**
 * What each page looks like while it loads, shared by its route's pending
 * skeleton and the view's own loading state.
 */
export const LOADING_LAYOUTS = {
  /** The cash-flow chart, quick actions, then waiting and recent lists. */
  finances: { chips: true, panels: ["cashflow"], rows: 3, sections: 2 },
  /** Week stats and the month calendar; the title has no summary line. */
  fitness: { description: false, panels: ["stats", "calendar"], sections: 0 },
  /** The spending chart above the reminders and cars. */
  garage: { panels: ["chart"], rows: 4, sections: 2 },
} as const satisfies Record<string, LoadingLayout>;
