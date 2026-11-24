import { Check, RotateCcw, SkipForward } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";

import type { ActionableSession } from "./use-session-actions";
import { useSessionActions } from "./use-session-actions";

/**
 * The row's quick actions. Planned or missed: Skip and Done (desktop buttons; on phones a
 * check circle, with Skip in the swipe). Done or skipped: Undo on desktop row hover.
 */
export const SessionActions = ({ session }: { session: ActionableSession }) => {
  const { t } = useTranslation("fitness");
  const actions = useSessionActions();

  if (!actions.open(session)) {
    return (
      <span className="hidden opacity-0 transition-opacity group-hover/row:opacity-100 focus-within:opacity-100 md:flex">
        <Button
          disabled={actions.pending}
          onClick={() => {
            void actions.mark(session, "planned");
          }}
          size="xs"
          variant="ghost"
        >
          <RotateCcw />
          {t("sessions.reopen")}
        </Button>
      </span>
    );
  }

  return (
    <>
      <span className="hidden shrink-0 items-center gap-1 md:flex">
        <Button
          disabled={actions.pending}
          onClick={() => {
            void actions.mark(session, "skipped");
          }}
          size="xs"
          variant="ghost"
        >
          <SkipForward />
          {t("sessions.skip")}
        </Button>
        <Button
          disabled={actions.pending}
          onClick={() => {
            void actions.mark(session, "done");
          }}
          size="xs"
          variant="outline"
        >
          <Check />
          {t("sessions.done")}
        </Button>
      </span>
      {/* Phones: the done circle, like reminders (swipe for Skip). */}
      <button
        aria-label={t("sessions.markDoneOf", { name: session.name })}
        className="group/done -mr-2 flex size-11 shrink-0 items-center justify-center md:hidden"
        disabled={actions.pending}
        onClick={() => {
          void actions.mark(session, "done");
        }}
        type="button"
      >
        <span className="text-muted-foreground/0 group-active/done:text-success border-muted-foreground/40 flex size-6 items-center justify-center rounded-full border-2 transition-colors">
          <Check className="size-3.5" />
        </span>
      </button>
    </>
  );
};
