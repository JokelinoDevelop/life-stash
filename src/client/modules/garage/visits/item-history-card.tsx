import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { ListRow, ListSection } from "@/components/app/list-section";
import { useFormat } from "@/lib/format";

import { itemHistoryQuery } from "./visits.queries";

/** "When was X last done?" for every catalog item ever logged on this car. */
export const ItemHistoryCard = ({ carId }: { carId: string }) => {
  const { t } = useTranslation("garageVisits");
  const format = useFormat();
  const history = useQuery(itemHistoryQuery(carId));
  const items = history.data?.items ?? [];

  return (
    <ListSection count={items.length} title={t("history.lastDone")}>
      {history.isSuccess && items.length === 0 && (
        <ListRow className="text-muted-foreground">
          {t("history.lastDoneEmpty")}
        </ListRow>
      )}
      {items.map((item) => (
        <ListRow asChild className="py-2 md:py-1.5" key={item.itemId}>
          <Link
            params={{ carId, visitId: item.visitId }}
            to="/garage/cars/$carId/services/$visitId"
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
          </Link>
        </ListRow>
      ))}
    </ListSection>
  );
};
