import type { ReminderStatus } from "@shared/domain/reminders";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

export type RingStatus = ReminderStatus | "done";

const TONE: Record<RingStatus, string> = {
  "due-soon": "text-warning",
  done: "text-success",
  overdue: "text-destructive",
  upcoming: "text-muted-foreground",
};

/**
 * Reminder status as one of four shapes: an empty ring (later), a ring with a
 * dot (due soon), a solid "!" disc (overdue) and a check (done). Colour is the
 * second cue.
 */
export const StatusRing = ({
  className,
  label,
  status,
}: {
  className?: string;
  /** Overrides the default status label; pass `null` when nearby text already says it. */
  label?: string | null;
  status: RingStatus;
}) => {
  const { t } = useTranslation();
  const accessibleLabel = label === undefined ? t(`status.${status}`) : label;

  const a11y =
    accessibleLabel === null
      ? { "aria-hidden": true }
      : { "aria-label": accessibleLabel, role: "img" };

  return (
    <svg
      className={cn("size-[18px] shrink-0 md:size-4", TONE[status], className)}
      data-slot="status-ring"
      data-status={status}
      viewBox="0 0 16 16"
      {...a11y}
    >
      {status === "overdue" && (
        <>
          <circle cx="8" cy="8" fill="currentColor" r="7" />
          <path
            d="M8 4.6v4.2M8 11.2v.1"
            stroke="var(--background)"
            strokeLinecap="round"
            strokeWidth="1.6"
          />
        </>
      )}
      {status === "done" && (
        <>
          <circle cx="8" cy="8" fill="currentColor" r="7" />
          <path
            d="m5 8.2 2 2 4-4.2"
            fill="none"
            stroke="var(--background)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.6"
          />
        </>
      )}
      {(status === "due-soon" || status === "upcoming") && (
        <circle
          cx="8"
          cy="8"
          fill="none"
          r="6.25"
          stroke="currentColor"
          strokeWidth="1.5"
        />
      )}
      {status === "due-soon" && (
        <circle cx="8" cy="8" fill="currentColor" r="3" />
      )}
    </svg>
  );
};
