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

/**
 * A car in the household list. Phones: monogram, name, odometer · plate,
 * status ring. Desktop: name, model, plate, odometer and this year's spend
 * as columns.
 */
export const CarRow = ({
  car,
  spent,
}: {
  car: CarListItem;
  /** This year's spend, already formatted. */
  spent?: string;
}) => {
  const { t } = useTranslation("garage");
  const { t: tc } = useTranslation();
  const format = useFormat();

  const odometer =
    car.latestOdometerKm === null
      ? t("cars.noOdometer")
      : format.distance(car.latestOdometerKm);

  const model = [car.year, car.make, car.model]
    .filter((part) => part !== null)
    .join(" ");

  const urgent =
    car.nextReminder !== null && car.nextReminder.status !== "upcoming"
      ? car.nextReminder
      : null;

  return (
    <ListRow asChild className="min-h-16 md:min-h-10">
      <Link params={{ carId: car.id }} to="/garage/cars/$carId">
        <CarMonogram className="md:hidden" name={car.name} />
        <CarMonogram className="hidden md:flex" name={car.name} size="sm" />
        <div className="flex min-w-0 flex-1 flex-col md:flex-row md:items-center md:gap-3">
          <span className="truncate text-base font-medium md:w-40 md:shrink-0 md:text-sm">
            {car.name}
          </span>
          <span className="text-muted-foreground hidden min-w-0 flex-1 truncate md:block">
            {model}
            {car.archivedAt === null ? null : ` · ${t("cars.archived")}`}
          </span>
          <span className="text-muted-foreground truncate text-xs tabular-nums md:hidden">
            {[odometer, car.plate].filter((part) => part !== null).join(" · ")}
          </span>
          <span className="text-subtle-foreground hidden w-24 shrink-0 text-xs font-medium tracking-wide tabular-nums md:block">
            {car.plate}
          </span>
          <span className="hidden w-28 shrink-0 truncate text-right tabular-nums md:block">
            {odometer}
          </span>
          <span className="text-muted-foreground hidden w-20 shrink-0 text-right tabular-nums md:block">
            {spent ?? "—"}
          </span>
        </div>
        {urgent !== null && (
          <StatusRing
            className="md:hidden"
            label={[urgent.title, tc(`status.${urgent.status}`)].join(": ")}
            progress={reminderProgress(urgent)}
            status={urgent.status}
          />
        )}
        <ChevronRight className="text-muted-foreground/60 size-4 shrink-0 md:hidden" />
      </Link>
    </ListRow>
  );
};
