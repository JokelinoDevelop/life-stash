import {
  distancePerYear,
  latestOdometer,
  totalDistance,
} from "@shared/domain/mileage";
import type { OdometerPoint } from "@shared/domain/mileage";
import { averagePerMonth } from "@shared/domain/mileage-buckets";
import { useTranslation } from "react-i18next";

import { Card, CardContent } from "@/components/ui/card";
import { useFormat } from "@/lib/format";

const Stat = ({ label, value }: { label: string; value: string }) => (
  <Card>
    <CardContent>
      <p className="text-muted-foreground text-sm">{label}</p>
      <p className="text-xl font-semibold tabular-nums">{value}</p>
    </CardContent>
  </Card>
);

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
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Stat
        label={t("stats.latest")}
        value={
          latest === null ? t("stats.none") : format.distance(latest.odometerKm)
        }
      />
      <Stat
        label={t("stats.total")}
        value={format.distance(totalDistance(points))}
      />
      <Stat label={t("stats.thisYear")} value={format.distance(thisYear)} />
      <Stat
        label={t("stats.perMonth")}
        value={average === null ? t("stats.none") : format.distance(average)}
      />
    </div>
  );
};
