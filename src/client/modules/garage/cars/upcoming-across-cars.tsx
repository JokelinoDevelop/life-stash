import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { StatusBadge } from "@/components/app/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { api, SuccessBody } from "@/lib/api";
import { useFormat } from "@/lib/format";

import { describeDue } from "./describe-due";

type CarListItem = SuccessBody<
  Awaited<ReturnType<typeof api.garage.cars.$get>>
>["cars"][number];

/** The most urgent reminder of every car that has something due soon or overdue. */
export const UpcomingAcrossCars = ({ cars }: { cars: CarListItem[] }) => {
  const { t } = useTranslation("garage");
  const { t: tc } = useTranslation();
  const format = useFormat();

  const urgent = cars.filter(
    (car) =>
      car.archivedAt === null &&
      car.nextReminder !== null &&
      car.nextReminder.status !== "upcoming"
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("home.upcoming")}</CardTitle>
      </CardHeader>
      <CardContent>
        {urgent.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t("home.allClear")}</p>
        ) : (
          <ul className="flex flex-col divide-y">
            {urgent.map((car) =>
              car.nextReminder === null ? null : (
                <li key={car.id}>
                  <Link
                    className="flex items-center justify-between gap-3 py-2"
                    params={{ carId: car.id }}
                    search={{ tab: "reminders" }}
                    to="/garage/cars/$carId"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium">
                        {car.nextReminder.title}
                      </span>
                      <span className="text-muted-foreground block truncate text-sm">
                        {car.name} · {describeDue(car.nextReminder, format, tc)}
                      </span>
                    </span>
                    <StatusBadge status={car.nextReminder.status} />
                  </Link>
                </li>
              )
            )}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};
