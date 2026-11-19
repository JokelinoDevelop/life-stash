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
  shortDate = false,
  visit,
}: {
  carId: string;
  /** Shown first in the meta line on household-wide lists. */
  carName?: string;
  /** Under a year heading: leave the year out of the date. */
  shortDate?: boolean;
  visit: VisitListItem;
}) => {
  const { t } = useTranslation("garageVisits");
  const format = useFormat();

  const meta = [
    carName ?? null,
    shortDate
      ? format.shortDate(visit.date, visit.datePrecision)
      : format.date(visit.date, visit.datePrecision),
    visit.odometerKm === null ? null : format.distance(visit.odometerKm),
    t(`kinds.${visit.kind}`),
    visit.shop,
    visit.byPreviousOwner ? t("history.previousOwner") : null,
  ]
    .filter((part) => part !== null)
    .join(" · ");

  return (
    <ListRow
      className="py-2 md:py-1.5"
      render={
        <Link
          params={{ carId, visitId: visit.id }}
          to="/garage/cars/$carId/services/$visitId"
        />
      }
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
    </ListRow>
  );
};
