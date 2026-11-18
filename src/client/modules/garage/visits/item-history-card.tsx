import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFormat } from "@/lib/format";

import { itemHistoryQuery } from "./visits.queries";

/** "When was X last done?" for every catalog item ever logged on this car. */
export const ItemHistoryCard = ({ carId }: { carId: string }) => {
  const { t } = useTranslation("garageVisits");
  const format = useFormat();
  const history = useQuery(itemHistoryQuery(carId));
  const items = history.data?.items ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("history.lastDone")}</CardTitle>
      </CardHeader>
      <CardContent>
        {history.isSuccess && items.length === 0 && (
          <p className="text-muted-foreground text-sm">
            {t("history.lastDoneEmpty")}
          </p>
        )}
        <ul className="flex flex-col divide-y">
          {items.map((item) => (
            <li key={item.itemId}>
              <Link
                className="flex items-center justify-between gap-3 py-2"
                params={{ carId, visitId: item.visitId }}
                to="/garage/cars/$carId/services/$visitId"
              >
                <span className="min-w-0 truncate">{item.name}</span>
                <span className="text-muted-foreground flex shrink-0 items-center gap-2 text-sm">
                  {item.byPreviousOwner && (
                    <Badge variant="secondary">
                      {t("history.previousOwner")}
                    </Badge>
                  )}
                  {format.date(item.lastDate, item.lastDatePrecision)}
                  {item.lastOdometerKm !== null &&
                    ` · ${format.distance(item.lastOdometerKm)}`}
                  <span>{t("history.times", { count: item.timesDone })}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};
