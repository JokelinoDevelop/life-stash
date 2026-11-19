import { withDeltas } from "@shared/domain/mileage";
import { Pencil, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/app/confirm-dialog";
import {
  ListRow,
  ListRowText,
  ListSection,
} from "@/components/app/list-section";
import { Button } from "@/components/ui/button";
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
    <ListSection count={rows.length} title={t("list.title")}>
      {rows.map(({ reading, kmSincePrevious, daysSincePrevious }) => (
        <ListRow
          className="py-2 md:py-1"
          key={`${reading.source}-${reading.id}`}
        >
          <ListRowText
            meta={
              <span className="tabular-nums">
                {[
                  format.date(reading.date),
                  t(`sources.${reading.source}`),
                  kmSincePrevious === null || daysSincePrevious === null
                    ? null
                    : t("list.sinceLast", {
                        days: t("list.days", { count: daysSincePrevious }),
                        distance: format.distance(kmSincePrevious),
                      }),
                  reading.source === "reading" ? reading.notes : null,
                ]
                  .filter((part) => part !== null)
                  .join(" · ")}
              </span>
            }
            title={
              <span className="tabular-nums">
                {format.distance(reading.odometerKm)}
              </span>
            }
          />
          {!readOnly && reading.source === "reading" && (
            <div className="flex shrink-0">
              <Button
                aria-label={tc("actions.edit")}
                onClick={() => {
                  onEdit(reading);
                }}
                size="icon-compact"
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
                    size="icon-compact"
                    variant="ghost"
                  >
                    <Trash2 />
                  </Button>
                }
              />
            </div>
          )}
        </ListRow>
      ))}
    </ListSection>
  );
};
