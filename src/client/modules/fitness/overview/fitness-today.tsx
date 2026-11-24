import { useTranslation } from "react-i18next";

import { ListSection } from "@/components/app/list-section";

import type { FitnessOverview } from "../fitness.queries";
import { SessionRow } from "../sessions/session-row";

/** Today page: today's trainings as rows (swipe for Skip / Done), when there are any. */
export const FitnessToday = ({ overview }: { overview: FitnessOverview }) => {
  const { t } = useTranslation("fitness");
  const sessions = overview.todaySessions;

  if (sessions.length === 0) {
    return null;
  }

  return (
    <ListSection count={sessions.length} title={t("today.title")}>
      {sessions.map((entry) => (
        <SessionRow entry={entry} key={entry.key} today={overview.today} />
      ))}
    </ListSection>
  );
};
