import { Link } from "@tanstack/react-router";
import { Camera } from "lucide-react";
import { useTranslation } from "react-i18next";

import { ListRow, ListRowText } from "@/components/app/list-section";
import { StatusRing } from "@/components/app/status-ring";
import { useFormat } from "@/lib/format";

import type { VisitListItem } from "./visits.queries";

/** One service visit as a list row: what was done, when, and what it cost. */
export const VisitRow = ({
  carId,
  carName,
  visit,
}: {
  carId: string;
  /** Shown first in the meta line on household-wide lists. */
  carName?: string;
  visit: VisitListItem;
}) => {
  const { t } = useTranslation("garageVisits");
  const format = useFormat();

  const meta = [
    carName ?? null,
    format.date(visit.date, visit.datePrecision),
    visit.odometerKm === null ? null : format.distance(visit.odometerKm),
    t(`kinds.${visit.kind}`),
    visit.shop,
    visit.byPreviousOwner ? t("history.previousOwner") : null,
  ]
    .filter((part) => part !== null)
    .join(" · ");

  return (
    <ListRow asChild className="py-2 md:py-1.5">
      <Link
        params={{ carId, visitId: visit.id }}
        to="/garage/cars/$carId/services/$visitId"
      >
        <StatusRing label={null} status="done" />
        <ListRowText
          meta={<span className="tabular-nums">{meta}</span>}
          title={visit.items.map((item) => item.label).join(", ")}
        />
        {visit.photoCount > 0 && (
          <span className="text-muted-foreground flex shrink-0 items-center gap-1 text-xs">
            <Camera aria-hidden="true" className="size-3.5" />
            <span aria-hidden="true">{visit.photoCount}</span>
            <span className="sr-only">
              {t("history.photos", { count: visit.photoCount })}
            </span>
          </span>
        )}
        {visit.effectiveTotalMinor !== null && (
          <span className="shrink-0 font-medium tabular-nums">
            {format.money(visit.effectiveTotalMinor, visit.currency)}
          </span>
        )}
      </Link>
    </ListRow>
  );
};
