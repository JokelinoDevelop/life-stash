import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { ListRow, ListSection } from "@/components/app/list-section";
import { Button } from "@/components/ui/button";
import { useFormat } from "@/lib/format";

import { itemHistoryQuery } from "./visits.queries";

const COLLAPSED_COUNT = 8;

/**
 * "When was X last done?" for every catalog item ever logged on this car.
 * Shows the first eight, with "Show all" for the rest.
 */
export const ItemHistoryCard = ({ carId }: { carId: string }) => {
  const { t } = useTranslation("garageVisits");
  const { t: tc } = useTranslation();
  const format = useFormat();
  const history = useQuery(itemHistoryQuery(carId));
  const [expanded, setExpanded] = useState(false);
  const all = history.data?.items ?? [];
  const items = expanded ? all : all.slice(0, COLLAPSED_COUNT);

  return (
    <ListSection
      action={
        all.length > COLLAPSED_COUNT && (
          <Button
            onClick={() => {
              setExpanded(!expanded);
            }}
            size="xs"
            variant="ghost"
          >
            {expanded
              ? tc("pagination.showLess")
              : tc("pagination.showAll", { count: all.length })}
          </Button>
        )
      }
      count={all.length}
      title={t("history.lastDone")}
    >
      {history.isSuccess && all.length === 0 && (
        <ListRow className="text-muted-foreground">
          {t("history.lastDoneEmpty")}
        </ListRow>
      )}
      {items.map((item) => (
        <ListRow
          className="py-2 md:py-1.5"
          key={item.itemId}
          render={
            <Link
              params={{ carId, visitId: item.visitId }}
              to="/garage/cars/$carId/services/$visitId"
            />
          }
        >
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate font-medium">{item.name}</span>
            <span className="text-muted-foreground truncate text-xs tabular-nums">
              {[
                format.date(item.lastDate, item.lastDatePrecision),
                item.lastOdometerKm === null
                  ? null
                  : format.distance(item.lastOdometerKm),
                item.byPreviousOwner ? t("history.previousOwner") : null,
              ]
                .filter((part) => part !== null)
                .join(" · ")}
            </span>
          </div>
          <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
            {t("history.times", { count: item.timesDone })}
          </span>
        </ListRow>
      ))}
    </ListSection>
  );
};
