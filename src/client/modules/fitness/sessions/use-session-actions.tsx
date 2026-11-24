import { Check, SkipForward } from "lucide-react";
import { useTranslation } from "react-i18next";

import type { SwipeAction } from "@/components/app/swipe-actions";
import { showDoneTick } from "@/lib/done-tick";

import { useMarkSession } from "../fitness.mutations";
import type { SessionStatus } from "./session-status";

export interface ActionableSession {
  id: string | null;
  scheduleId: string | null;
  originalDate: string | null;
  status: SessionStatus;
}

type Mark = "planned" | "done" | "skipped";

/** Missed is derived; stored it is still planned. */
const storedStatus = (status: SessionStatus): Mark =>
  status === "missed" ? "planned" : status;

/** Still to do: planned, or planned and past (missed). */
const isOpen = (session: ActionableSession) =>
  session.status === "planned" || session.status === "missed";

/** Done / Skip / Undo for a session row, shared by its buttons and its phone swipe. */
export const useSessionActions = () => {
  const { t } = useTranslation("fitness");
  const markSession = useMarkSession();

  const mark = (session: ActionableSession, status: Mark) => {
    markSession.mutate({
      previous: storedStatus(session.status),
      session,
      status,
    });

    if (status === "done") {
      showDoneTick();
    }
  };

  const swipeFor = (session: ActionableSession): SwipeAction[] =>
    isOpen(session)
      ? [
          {
            icon: <SkipForward />,
            label: t("sessions.skip"),
            onSelect: () => {
              mark(session, "skipped");
            },
            tone: "neutral",
          },
          {
            icon: <Check />,
            label: t("sessions.done"),
            onSelect: () => {
              mark(session, "done");
            },
            tone: "success",
          },
        ]
      : [];

  return { mark, swipeFor, open: isOpen, pending: markSession.isPending };
};
