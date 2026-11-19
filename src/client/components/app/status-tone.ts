import type { RingStatus } from "./status-ring";

/** Text colour for due text next to a ring (warning uses its readable shade). */
export const STATUS_TEXT_TONE: Record<RingStatus, string> = {
  "due-soon": "text-warning-foreground",
  done: "text-success",
  overdue: "text-destructive",
  upcoming: "text-muted-foreground",
};
