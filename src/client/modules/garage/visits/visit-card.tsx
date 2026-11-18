import { Link } from "@tanstack/react-router";
import { Camera } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { useFormat } from "@/lib/format";

import type { VisitListItem } from "./visits.queries";

export const VisitCard = ({
  carId,
  visit,
}: {
  carId: string;
  visit: VisitListItem;
}) => {
  const { t } = useTranslation("garageVisits");
  const format = useFormat();

  return (
    <Link
      className="bg-card text-card-foreground hover:bg-accent/50 block rounded-xl border p-4 shadow-sm transition-colors"
      params={{ carId, visitId: visit.id }}
      to="/garage/cars/$carId/services/$visitId"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="font-medium">
            {format.date(visit.date, visit.datePrecision)}
          </span>
          {visit.odometerKm !== null && (
            <span className="text-muted-foreground">
              {format.distance(visit.odometerKm)}
            </span>
          )}
          <Badge variant="outline">{t(`kinds.${visit.kind}`)}</Badge>
          {visit.byPreviousOwner && (
            <Badge variant="secondary">{t("history.previousOwner")}</Badge>
          )}
        </div>
        {visit.effectiveTotalMinor !== null && (
          <span className="font-semibold tabular-nums">
            {format.money(visit.effectiveTotalMinor, visit.currency)}
          </span>
        )}
      </div>
      <p className="mt-2 line-clamp-2">
        {visit.items.map((item) => item.label).join(", ")}
      </p>
      {(visit.shop !== null || visit.photoCount > 0) && (
        <div className="text-muted-foreground mt-2 flex flex-wrap items-center gap-3 text-sm">
          {visit.shop !== null && <span>{visit.shop}</span>}
          {visit.photoCount > 0 && (
            <span className="flex items-center gap-1">
              <Camera className="size-4" />
              {t("history.photos", { count: visit.photoCount })}
            </span>
          )}
        </div>
      )}
    </Link>
  );
};
