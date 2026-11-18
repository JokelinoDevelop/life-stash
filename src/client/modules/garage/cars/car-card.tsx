import { Link } from "@tanstack/react-router";
import { CarFront, ChevronRight, Gauge } from "lucide-react";
import { useTranslation } from "react-i18next";

import { StatusBadge } from "@/components/app/status-badge";
import { Badge } from "@/components/ui/badge";
import type { SuccessBody, api } from "@/lib/api";
import { useFormat } from "@/lib/format";

import { describeDue } from "./describe-due";

type CarListItem = SuccessBody<
  Awaited<ReturnType<typeof api.garage.cars.$get>>
>["cars"][number];

export const CarCard = ({ car }: { car: CarListItem }) => {
  const { t } = useTranslation("garage");
  const format = useFormat();
  const { t: tc } = useTranslation();

  const subtitle = [car.year, car.make, car.model]
    .filter((part) => part !== null)
    .join(" ");

  return (
    <Link className="block" params={{ carId: car.id }} to="/garage/cars/$carId">
      <div className="bg-card text-card-foreground hover:bg-accent/50 flex flex-col gap-3 rounded-xl border p-4 shadow-sm transition-colors">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 text-primary flex size-11 shrink-0 items-center justify-center rounded-xl">
            <CarFront className="size-6" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="truncate font-semibold">{car.name}</h3>
              {car.plate !== null && (
                <Badge variant="outline">{car.plate}</Badge>
              )}
              {car.archivedAt !== null && (
                <Badge variant="secondary">{t("cars.archived")}</Badge>
              )}
            </div>
            {subtitle !== "" && (
              <p className="text-muted-foreground truncate text-sm">
                {subtitle}
              </p>
            )}
          </div>
          <ChevronRight className="text-muted-foreground size-5" />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <span className="text-muted-foreground flex items-center gap-1.5">
            <Gauge className="size-4" />
            {car.latestOdometerKm === null
              ? t("cars.noOdometer")
              : format.distance(car.latestOdometerKm)}
          </span>
          {car.nextReminder === null ? (
            <span className="text-muted-foreground">
              {t("cars.noReminders")}
            </span>
          ) : (
            <span className="flex min-w-0 items-center gap-2">
              <span className="truncate">
                {car.nextReminder.title} ·{" "}
                {describeDue(car.nextReminder, format, tc)}
              </span>
              <StatusBadge status={car.nextReminder.status} />
            </span>
          )}
        </div>
      </div>
    </Link>
  );
};
