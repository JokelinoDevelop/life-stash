import { reminderProgress } from "@shared/domain/reminders";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import {
  ListRow,
  ListRowText,
  ListSection,
} from "@/components/app/list-section";
import { StatusRing } from "@/components/app/status-ring";
import { STATUS_TEXT_TONE } from "@/components/app/status-tone";
import { useFormat } from "@/lib/format";
import { cn } from "@/lib/utils";

import type { CarListItem } from "./car-row";
import { describeDue } from "./describe-due";

/** The most urgent reminder of every car that has something due soon or overdue. */
export const UpcomingAcrossCars = ({ cars }: { cars: CarListItem[] }) => {
  const { t } = useTranslation("garage");
  const { t: tc } = useTranslation();
  const format = useFormat();

  const urgent = cars.flatMap((car) =>
    car.archivedAt === null &&
    car.nextReminder !== null &&
    car.nextReminder.status !== "upcoming"
      ? [{ car, reminder: car.nextReminder }]
      : []
  );

  return (
    <ListSection count={urgent.length} title={t("home.needsAttention")}>
      {urgent.length === 0 ? (
        <ListRow className="text-muted-foreground">
          {t("home.allClear")}
        </ListRow>
      ) : (
        urgent.map(({ car, reminder }) => (
          <ListRow asChild key={car.id}>
            <Link
              params={{ carId: car.id }}
              search={{ tab: "reminders" }}
              to="/garage/cars/$carId"
            >
              <StatusRing
                label={null}
                progress={reminderProgress(reminder)}
                status={reminder.status}
              />
              <ListRowText meta={car.name} title={reminder.title} />
              <span
                className={cn(
                  "shrink-0 text-sm font-medium tabular-nums",
                  STATUS_TEXT_TONE[reminder.status]
                )}
              >
                {describeDue(reminder, format, tc)}
              </span>
            </Link>
          </ListRow>
        ))
      )}
    </ListSection>
  );
};
