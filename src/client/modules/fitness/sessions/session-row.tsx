import { useTranslation } from "react-i18next";

import { ListRow, ListRowText } from "@/components/app/list-section";
import { StatusRing } from "@/components/app/status-ring";
import { cn } from "@/lib/utils";

import { FitnessDialogLink } from "../dialogs/fitness-dialog-link";
import { SESSION_STATUS_TONE, sessionRing } from "./session-status";
import { sessionTarget } from "./session-target";
import type { SessionRowEntry } from "./session-target";
import { useSessionSwipe } from "./use-session-swipe";

/** One session: status shape, name, then status · duration · note; swipe for Skip / Done. */
export const SessionRow = ({
  entry,
  meta,
  today,
}: {
  entry: SessionRowEntry;
  /** Extra facts before the status (Today shows "Fitness"). */
  meta?: string;
  today: string;
}) => {
  const { t } = useTranslation("fitness");
  const swipeFor = useSessionSwipe();
  const ring = sessionRing(entry.status, entry.date, today);

  const facts = [
    entry.durationMinutes === null
      ? null
      : t("minutes", { count: entry.durationMinutes }),
    entry.note?.split("\n")[0] ?? null,
  ].filter((fact) => fact !== null && fact !== "");

  return (
    <ListRow
      render={<FitnessDialogLink entry={sessionTarget(entry)} />}
      swipe={swipeFor(entry)}
    >
      <StatusRing label={null} status={ring} />
      <ListRowText
        meta={
          <>
            {meta !== undefined && `${meta} · `}
            <span className={cn(SESSION_STATUS_TONE[entry.status])}>
              {t(`status.${entry.status}`)}
            </span>
            {facts.map((fact) => ` · ${fact}`).join("")}
          </>
        }
        title={
          <span className={cn(entry.status === "skipped" && "line-through")}>
            {entry.name}
          </span>
        }
      />
    </ListRow>
  );
};
