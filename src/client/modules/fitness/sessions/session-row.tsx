import { useTranslation } from "react-i18next";

import { ListRow } from "@/components/app/list-section";
import { StatusRing } from "@/components/app/status-ring";
import { cn } from "@/lib/utils";

import { FitnessDialogLink } from "../dialogs/fitness-dialog-link";
import { SessionActions } from "./session-actions";
import { SESSION_STATUS_TONE, sessionRing } from "./session-status";
import { sessionTarget } from "./session-target";
import type { SessionRowEntry } from "./session-target";
import { useSessionActions } from "./use-session-actions";

/**
 * One session: status shape, name, then status · duration · note (opens the dialog), and
 * Skip / Done beside it; phones also swipe.
 */
export const SessionRow = ({
  entry,
  today,
}: {
  entry: SessionRowEntry;
  today: string;
}) => {
  const { t } = useTranslation("fitness");
  const actions = useSessionActions();
  const ring = sessionRing(entry.status, entry.date, today);

  const facts = [
    entry.durationMinutes === null
      ? null
      : t("minutes", { count: entry.durationMinutes }),
    entry.note?.split("\n")[0] ?? null,
  ].filter((fact) => fact !== null && fact !== "");

  return (
    <ListRow className="gap-2 md:gap-3" swipe={actions.swipeFor(entry)}>
      <FitnessDialogLink
        className="flex min-w-0 flex-1 items-center gap-3 self-stretch"
        entry={sessionTarget(entry)}
      >
        <StatusRing label={null} status={ring} />
        {/* Two lines everywhere: the day column beside the calendar is narrow. */}
        <span className="flex min-w-0 flex-1 flex-col py-1.5">
          <span
            className={cn(
              "truncate font-medium",
              entry.status === "skipped" && "line-through"
            )}
          >
            {entry.name}
          </span>
          <span className="text-muted-foreground truncate text-xs">
            <span className={cn(SESSION_STATUS_TONE[entry.status])}>
              {t(`status.${entry.status}`)}
            </span>
            {facts.map((fact) => ` · ${fact}`).join("")}
          </span>
        </span>
      </FitnessDialogLink>
      <SessionActions name={entry.name} session={entry} />
    </ListRow>
  );
};
