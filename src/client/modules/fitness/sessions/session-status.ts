import type { RingStatus } from "@/components/app/status-ring";

export type SessionStatus = "planned" | "done" | "skipped" | "missed";

/**
 * Sessions reuse the four status shapes: done = check, missed = "!" disc, planned today =
 * ring with a dot, anything else (later, or skipped) = empty ring.
 */
export const sessionRing = (
  status: SessionStatus,
  date: string,
  today: string
): RingStatus => {
  if (status === "done") {
    return "done";
  }

  if (status === "missed") {
    return "overdue";
  }

  return status === "planned" && date === today ? "due-soon" : "upcoming";
};

export const SESSION_STATUS_TONE: Record<SessionStatus, string> = {
  done: "text-success",
  missed: "text-destructive",
  planned: "text-muted-foreground",
  skipped: "text-muted-foreground",
};
