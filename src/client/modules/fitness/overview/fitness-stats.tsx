import { useTranslation } from "react-i18next";

import { Stat, StatPanel } from "@/components/app/stat-panel";

import type { FitnessOverview } from "../fitness.queries";
import { useWeightFormat } from "../weight/use-weight-format";

/** This week's count, the streak, the latest weight and its 30-day change. */
export const FitnessStats = ({ overview }: { overview: FitnessOverview }) => {
  const { t } = useTranslation("fitness");
  const weight = useWeightFormat();
  const { week } = overview;

  return (
    <StatPanel bleed>
      <Stat
        hint={t("overview.thisWeek")}
        label={t("overview.week")}
        value={t("overview.weekValue", {
          done: week.done,
          scheduled: week.scheduled,
        })}
      />
      <Stat
        hint={t("overview.streakHint")}
        label={t("overview.streak")}
        value={t("overview.weeks", { count: overview.streakWeeks })}
      />
      <Stat
        label={t("overview.weight")}
        value={weight.kg(overview.weight.latest?.weightGrams ?? null)}
      />
      <Stat
        hint={t("overview.change7", {
          value: weight.change(overview.weight.change7Grams),
        })}
        label={t("overview.change30")}
        value={weight.change(overview.weight.change30Grams)}
      />
    </StatPanel>
  );
};
