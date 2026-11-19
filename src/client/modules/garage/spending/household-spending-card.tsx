import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import {
  ListRow,
  ListRowText,
  ListSection,
} from "@/components/app/list-section";
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
    <ListSection title={t("household.title")}>
      {rows.length === 0 ? (
        <ListRow className="text-muted-foreground">
          {t("household.empty")}
        </ListRow>
      ) : (
        rows.map((row) => (
          <ListRow asChild key={row.carId}>
            <Link
              params={{ carId: row.carId }}
              search={{ tab: "spending" }}
              to="/garage/cars/$carId"
            >
              <ListRowText
                meta={`${t("household.other")}: ${format.totals(row.other)}`}
                title={row.carName}
              />
              <span className="shrink-0 text-right font-medium tabular-nums">
                {format.totals(row.maintenance)}
                <span className="text-muted-foreground block text-xs font-normal md:inline md:text-sm">
                  {" "}
                  {t("household.maintenance")}
                </span>
              </span>
            </Link>
          </ListRow>
        ))
      )}
    </ListSection>
  );
};
