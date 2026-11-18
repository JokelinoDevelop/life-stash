import { withDeltas } from "@shared/domain/mileage";
import { Pencil, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/app/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api, unwrap } from "@/lib/api";
import { useErrorMessage } from "@/lib/errors";
import { useFormat } from "@/lib/format";

import { useInvalidateGarage } from "../cars/cars.queries";
import type { MileagePoint } from "./mileage.queries";

export const ReadingsList = ({
  points,
  readOnly,
  onEdit,
}: {
  points: MileagePoint[];
  readOnly: boolean;
  onEdit: (point: MileagePoint) => void;
}) => {
  const { t } = useTranslation("garageMileage");
  const { t: tc } = useTranslation();
  const format = useFormat();
  const errorMessage = useErrorMessage();
  const invalidate = useInvalidateGarage();
  const rows = withDeltas(points).toReversed();

  const remove = async (readingId: string) => {
    try {
      await unwrap(
        api.garage.mileage[":readingId"].$delete({ param: { readingId } })
      );
      await invalidate();
      toast.success(t("deleted"));
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("list.title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="flex flex-col divide-y">
          {rows.map(({ reading, kmSincePrevious, daysSincePrevious }) => (
            <li
              className="flex items-center gap-3 py-2"
              key={`${reading.source}-${reading.id}`}
            >
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2">
                  <span className="font-medium tabular-nums">
                    {format.distance(reading.odometerKm)}
                  </span>
                  <Badge variant="secondary">
                    {t(`sources.${reading.source}`)}
                  </Badge>
                </p>
                <p className="text-muted-foreground truncate text-sm">
                  {format.date(reading.date)}
                  {kmSincePrevious !== null &&
                    daysSincePrevious !== null &&
                    ` · ${t("list.sinceLast", {
                      days: t("list.days", { count: daysSincePrevious }),
                      distance: format.distance(kmSincePrevious),
                    })}`}
                  {reading.source === "reading" &&
                    reading.notes !== null &&
                    ` · ${reading.notes}`}
                </p>
              </div>
              {!readOnly && reading.source === "reading" && (
                <div className="flex shrink-0 gap-1">
                  <Button
                    aria-label={tc("actions.edit")}
                    onClick={() => {
                      onEdit(reading);
                    }}
                    size="icon"
                    variant="ghost"
                  >
                    <Pencil />
                  </Button>
                  <ConfirmDialog
                    onConfirm={async () => {
                      await remove(reading.id);
                    }}
                    trigger={
                      <Button
                        aria-label={tc("actions.delete")}
                        size="icon"
                        variant="ghost"
                      >
                        <Trash2 />
                      </Button>
                    }
                  />
                </div>
              )}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};
