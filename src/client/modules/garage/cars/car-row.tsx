import { reminderProgress } from "@shared/domain/reminders";
import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";

import { ListRow } from "@/components/app/list-section";
import { StatusRing } from "@/components/app/status-ring";
import type { SuccessBody, api } from "@/lib/api";
import { useFormat } from "@/lib/format";

import { CarMonogram } from "./car-monogram";

export type CarListItem = SuccessBody<
  Awaited<ReturnType<typeof api.garage.cars.$get>>
>["cars"][number];

export const CarRow = ({ car }: { car: CarListItem }) => {
  const { t } = useTranslation("garage");
  const { t: tc } = useTranslation();
  const format = useFormat();

  const meta = [
    car.latestOdometerKm === null
      ? t("cars.noOdometer")
      : format.distance(car.latestOdometerKm),
    car.plate,
    car.archivedAt === null ? null : t("cars.archived"),
  ]
    .filter((part) => part !== null)
    .join(" · ");

  const subtitle = [car.year, car.make, car.model]
    .filter((part) => part !== null)
    .join(" ");

  const urgent =
    car.nextReminder !== null && car.nextReminder.status !== "upcoming"
      ? car.nextReminder
      : null;

  return (
    <ListRow asChild className="min-h-16 md:min-h-12">
      <Link params={{ carId: car.id }} to="/garage/cars/$carId">
        <CarMonogram name={car.name} />
        <div className="flex min-w-0 flex-1 flex-col md:flex-row md:items-baseline md:gap-3">
          <span className="truncate font-medium">{car.name}</span>
          {subtitle !== "" && (
            <span className="text-muted-foreground hidden truncate md:inline">
              {subtitle}
            </span>
          )}
          <span className="text-muted-foreground truncate text-xs tabular-nums md:ml-auto md:text-sm">
            {meta}
          </span>
        </div>
        {urgent !== null && (
          <StatusRing
            label={[urgent.title, tc(`status.${urgent.status}`)].join(": ")}
            progress={reminderProgress(urgent)}
            status={urgent.status}
          />
        )}
        <ChevronRight className="text-muted-foreground/60 size-4 shrink-0" />
      </Link>
    </ListRow>
  );
};
