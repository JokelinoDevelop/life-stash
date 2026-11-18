import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFormat } from "@/lib/format";
import { todayIso } from "@/lib/partial-date";

import { householdSpendingQuery } from "./spending.queries";

/** "Spent this year" per active car: maintenance & repairs vs other costs. */
export const HouseholdSpendingCard = () => {
  const { t } = useTranslation("garageSpending");
  const format = useFormat();
  const spending = useQuery(householdSpendingQuery);
  const year = Number(todayIso().slice(0, 4));

  const rows = (spending.data?.cars ?? []).flatMap((car) => {
    const current = car.years.filter((entry) => entry.year === year);

    if (car.archived || current.length === 0) {
      return [];
    }

    return [
      {
        carId: car.carId,
        carName: car.carName,
        maintenance: current.map((entry) => ({
          amountMinor: entry.maintenanceMinor,
          currency: entry.currency,
        })),
        other: current.map((entry) => ({
          amountMinor: entry.otherMinor,
          currency: entry.currency,
        })),
      },
    ];
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("household.title")}</CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            {t("household.empty")}
          </p>
        ) : (
          <ul className="flex flex-col divide-y">
            {rows.map((row) => (
              <li key={row.carId}>
                <Link
                  className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-2"
                  params={{ carId: row.carId }}
                  search={{ tab: "spending" }}
                  to="/garage/cars/$carId"
                >
                  <span className="font-medium">{row.carName}</span>
                  <span className="text-muted-foreground text-sm tabular-nums">
                    {t("household.maintenance")}:{" "}
                    {format.totals(row.maintenance)} · {t("household.other")}:{" "}
                    {format.totals(row.other)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};
