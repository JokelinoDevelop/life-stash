import type { ReminderStatus } from "@shared/domain/reminders";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

export type RingStatus = ReminderStatus | "done";

/** Circumference of the inner pie circle (r = 2.5 in a 16-unit box). */
const PIE_CIRCUMFERENCE = 2 * Math.PI * 2.5;

const TONE: Record<RingStatus, string> = {
  "due-soon": "text-warning",
  done: "text-success",
  overdue: "text-destructive",
  upcoming: "text-muted-foreground",
};

/**
 * Reminder status as a shape: a ring that fills as the interval is used up,
 * a solid "!" disc when overdue and a check when done. Colour is the second cue.
 */
export const StatusRing = ({
  className,
  label,
  progress = 0,
  status,
}: {
  className?: string;
  /** Overrides the default status label; pass `null` when nearby text already says it. */
  label?: string | null;
  /** Share of the interval used, 0–1 (see `reminderProgress`). */
  progress?: number;
  status: RingStatus;
}) => {
  const { t } = useTranslation();
  const accessibleLabel = label === undefined ? t(`status.${status}`) : label;

  const a11y =
    accessibleLabel === null
      ? { "aria-hidden": true }
      : { "aria-label": accessibleLabel, role: "img" };

  const filled = Math.min(1, Math.max(0, progress)) * PIE_CIRCUMFERENCE;

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
        <>
          <circle
            cx="8"
            cy="8"
            fill="none"
            r="6.25"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <circle
            cx="8"
            cy="8"
            fill="none"
            r="2.5"
            stroke="currentColor"
            strokeDasharray={`${filled} ${PIE_CIRCUMFERENCE}`}
            strokeWidth="5"
            transform="rotate(-90 8 8)"
          />
        </>
      )}
    </svg>
  );
};
