import { useTranslation } from "react-i18next";

import {
  AnimatedCount,
  AnimatedDistance,
  AnimatedMoney,
} from "@/components/app/animated-number";
import { Stat, StatPanel } from "@/components/app/stat-panel";

import type { HouseholdMoney } from "./household-money";
import { Change } from "./household-spending";
import type { HouseholdReminder } from "./household.queries";

/** Desktop: spent, driven, due in 30 days and overdue across the household. */
export const HouseholdStats = ({
  carCount,
  kmThisYear,
  money,
  next30,
  overdue,
  year,
}: {
  carCount: number;
  kmThisYear: number;
  money: HouseholdMoney;
  next30: HouseholdReminder[];
  overdue: HouseholdReminder[];
  year: number;
}) => {
  const { t } = useTranslation("garage");

  return (
    <StatPanel bleed className="hidden md:grid">
      <Stat
        hint={<Change money={money} year={year} />}
        label={t("home.spentThisYear", { year })}
        value={
          <AnimatedMoney
            amountMinor={money.thisYear}
            currency={money.currency}
          />
        }
      />
      <Stat
        hint={t("home.acrossCars", { count: carCount })}
        label={t("home.drivenThisYear", { year })}
        value={<AnimatedDistance km={kmThisYear} />}
      />
      <Stat
        hint={next30.map((reminder) => reminder.title).join(", ") || undefined}
        label={t("home.dueIn30")}
        value={<AnimatedCount value={next30.length} />}
      />
      <Stat
        hint={
          overdue.length === 0
            ? t("home.nothingOverdue")
            : overdue.map((reminder) => reminder.title).join(", ")
        }
        label={t("home.overdueLabel")}
        value={
          <span className={overdue.length > 0 ? "text-destructive" : undefined}>
            <AnimatedCount value={overdue.length} />
          </span>
        }
      />
    </StatPanel>
  );
};
