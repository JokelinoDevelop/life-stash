import {
  distancePerYear,
  latestOdometer,
  totalDistance,
} from "@shared/domain/mileage";
import type { OdometerPoint } from "@shared/domain/mileage";
import { averagePerMonth } from "@shared/domain/mileage-buckets";
import { useTranslation } from "react-i18next";

import { AnimatedDistance } from "@/components/app/animated-number";
import { Stat, StatPanel } from "@/components/app/stat-panel";
import { useFormat } from "@/lib/format";

export const MileageStats = ({
  points,
  today,
}: {
  points: OdometerPoint[];
  today: string;
}) => {
  const { t } = useTranslation("garageMileage");
  const format = useFormat();
  const latest = latestOdometer(points);
  const year = Number(today.slice(0, 4));

  const thisYear =
    distancePerYear(points).find((entry) => entry.year === year)?.km ?? 0;

  const average = averagePerMonth(points);

  return (
    <StatPanel>
      <Stat
        label={t("stats.latest")}
        value={
          latest === null ? (
            t("stats.none")
          ) : (
            <AnimatedDistance km={latest.odometerKm} />
          )
        }
      />
      <Stat
        label={t("stats.total")}
        value={<AnimatedDistance km={totalDistance(points)} />}
      />
      <Stat
        label={t("stats.thisYear")}
        value={<AnimatedDistance km={thisYear} />}
      />
      <Stat
        label={t("stats.perMonth")}
        value={average === null ? t("stats.none") : format.distance(average)}
      />
    </StatPanel>
  );
};
