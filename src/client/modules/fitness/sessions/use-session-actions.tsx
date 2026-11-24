import { Check, SkipForward } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useConfirm } from "@/components/app/confirm/confirm-context";
import type { SwipeAction } from "@/components/app/swipe-actions";
import { showDoneTick } from "@/lib/done-tick";

import { useMarkSession } from "../fitness.mutations";
import type { SessionStatus } from "./session-status";

export interface ActionableSession {
  id: string | null;
  scheduleId: string | null;
  originalDate: string | null;
  status: SessionStatus;
  /** Named in the confirmation. */
  name: string;
}

type Mark = "planned" | "done" | "skipped";

/** Missed is derived; stored it is still planned. */
const storedStatus = (status: SessionStatus): Mark =>
  status === "missed" ? "planned" : status;

/** Still to do: planned, or planned and past (missed). */
const isOpen = (session: ActionableSession) =>
  session.status === "planned" || session.status === "missed";

/**
 * Done / Skip / back to planned for a session row, shared by its buttons and its phone swipe.
 * Each asks first (changes are confirmed); the toast still offers Undo.
 */
export const useSessionActions = () => {
  const { t } = useTranslation("fitness");
  const confirm = useConfirm();
  const markSession = useMarkSession();

  const mark = async (session: ActionableSession, status: Mark) => {
    const ok = await confirm({
      confirmLabel: t(`sessions.confirm.${status}.action`),
      description: t(`sessions.confirm.${status}.description`),
      title: t(`sessions.confirm.${status}.title`, { name: session.name }),
    });

    if (!ok) {
      return;
    }

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

  return { mark, swipeFor, open: isOpen, pending: markSession.isPending };
};
