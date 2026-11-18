import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { StatusBadge } from "@/components/app/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { api, SuccessBody } from "@/lib/api";
import { useFormat } from "@/lib/format";

import { CompleteReminderButton } from "../reminders/complete-reminder-button";
import type { CarTab } from "./car-tabs";
import { describeDue } from "./describe-due";

type Overview = SuccessBody<
  Awaited<ReturnType<(typeof api.garage.cars)[":carId"]["overview"]["$get"]>>
>;

const ViewAll = ({ carId, tab }: { carId: string; tab: CarTab }) => {
  const { t } = useTranslation("garage");

  return (
    <CardAction>
      <Button asChild size="sm" variant="link">
        <Link params={{ carId }} search={{ tab }} to="/garage/cars/$carId">
          {t("overview.viewAll")}
        </Link>
      </Button>
    </CardAction>
  );
};

export const DueNextCard = ({
  carId,
  readOnly,
  reminders,
}: {
  carId: string;
  readOnly: boolean;
  reminders: Overview["dueReminders"];
}) => {
  const { t } = useTranslation("garage");
  const { t: tc } = useTranslation();
  const format = useFormat();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("overview.dueNext")}</CardTitle>
        <ViewAll carId={carId} tab="reminders" />
      </CardHeader>
      <CardContent>
        {reminders.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            {t("overview.nothingDue")}
          </p>
        ) : (
          <ul className="flex flex-col divide-y">
            {reminders.map((reminder) => (
              <li
                className="flex items-center justify-between gap-3 py-2"
                key={reminder.id}
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{reminder.title}</p>
                  <p className="text-muted-foreground truncate text-sm">
                    {describeDue(reminder, format, tc)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <StatusBadge status={reminder.status} />
                  {!readOnly && (
                    <CompleteReminderButton carId={carId} reminder={reminder} />
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};

export const RecentVisitsCard = ({
  carId,
  visits,
}: {
  carId: string;
  visits: Overview["recentVisits"];
}) => {
  const { t } = useTranslation("garage");
  const format = useFormat();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("overview.lastDone")}</CardTitle>
        <ViewAll carId={carId} tab="history" />
      </CardHeader>
      <CardContent>
        {visits.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            {t("overview.noHistory")}
          </p>
        ) : (
          <ul className="flex flex-col divide-y">
            {visits.map((visit) => (
              <li key={visit.id}>
                <Link
                  className="flex flex-col gap-0.5 py-2"
                  params={{ carId, visitId: visit.id }}
                  to="/garage/cars/$carId/services/$visitId"
                >
                  <span className="text-muted-foreground flex items-center gap-2 text-sm">
                    {format.date(visit.date, visit.datePrecision)}
                    {visit.odometerKm !== null &&
                      ` · ${format.distance(visit.odometerKm)}`}
                    {visit.byPreviousOwner && (
                      <Badge variant="secondary">
                        {t("overview.previousOwner")}
                      </Badge>
                    )}
                  </span>
                  <span className="line-clamp-2">{visit.items.join(", ")}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};

export const DrivenCard = ({
  carId,
  overview,
}: {
  carId: string;
  overview: Overview;
}) => {
  const { t } = useTranslation("garage");
  const format = useFormat();
  const latest = overview.latestOdometer;

  const latestText =
    latest === null
      ? t("cars.noOdometer")
      : `${t("overview.latestOdometer")}: ${format.distance(latest.km)} · ${t(
          "overview.loggedOn",
          {
            date: format.date(latest.date),
          }
        )}`;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("overview.driven")}</CardTitle>
        <ViewAll carId={carId} tab="mileage" />
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-semibold tabular-nums">
          {t("overview.kmThisYear", {
            distance: format.distance(overview.kmThisYear),
          })}
        </p>
        <p className="text-muted-foreground mt-1 text-sm">{latestText}</p>
      </CardContent>
    </Card>
  );
};

export const SpentCard = ({
  carId,
  overview,
}: {
  carId: string;
  overview: Overview;
}) => {
  const { t } = useTranslation("garage");
  const format = useFormat();

  const amount = (values: Overview["maintenanceThisYear"]) =>
    values.length === 0 ? t("overview.nothingSpent") : format.totals(values);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("overview.spent")}</CardTitle>
        <ViewAll carId={carId} tab="spending" />
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-muted-foreground text-sm">
              {t("overview.maintenance")}
            </p>
            <p className="text-xl font-semibold tabular-nums">
              {amount(overview.maintenanceThisYear)}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-sm">
              {t("overview.otherCosts")}
            </p>
            <p className="text-xl font-semibold tabular-nums">
              {amount(overview.expensesThisYear)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
