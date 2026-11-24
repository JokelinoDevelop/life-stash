import { Check, SkipForward } from "lucide-react";
import { useTranslation } from "react-i18next";

import type { SwipeAction } from "@/components/app/swipe-actions";
import { showDoneTick } from "@/lib/done-tick";

import { usePutOccurrence, useUpdateSession } from "../fitness.mutations";
import type { SessionStatus } from "./session-status";

export interface SwipeableSession {
  id: string | null;
  scheduleId: string | null;
  originalDate: string | null;
  status: SessionStatus;
}

/**
 * Phone swipe actions for a session row: Skip and Done while it is planned or missed. They
 * write the same change as the dialog (an untouched weekly occurrence gets its row).
 */
export const useSessionSwipe = () => {
  const { t } = useTranslation("fitness");
  const update = useUpdateSession();
  const putOccurrence = usePutOccurrence();

  const mark = async (
    session: SwipeableSession,
    status: "done" | "skipped"
  ) => {
    if (session.id !== null) {
      await update.mutateAsync({ id: session.id, json: { status } });
    } else if (session.scheduleId !== null && session.originalDate !== null) {
      await putOccurrence.mutateAsync({
        originalDate: session.originalDate,
        scheduleId: session.scheduleId,
        status,
      });
    }

    if (status === "done") {
      showDoneTick();
    }
  };

  return (session: SwipeableSession): SwipeAction[] =>
    session.status === "planned" || session.status === "missed"
      ? [
          {
            icon: <SkipForward />,
            label: t("sessions.skip"),
            onSelect: () => {
              void mark(session, "skipped");
            },
            tone: "neutral",
          },
          {
            icon: <Check />,
            label: t("sessions.done"),
            onSelect: () => {
              void mark(session, "done");
            },
            tone: "success",
          },
        ]
      : [];
};
