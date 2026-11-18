import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { ResponsiveDialog } from "@/components/app/responsive-dialog";
import { api, unwrap } from "@/lib/api";
import { useErrorMessage } from "@/lib/errors";
import { useFormat } from "@/lib/format";
import { todayIso } from "@/lib/partial-date";

import { useInvalidateGarage } from "../cars/cars.queries";
import type { MileagePoint } from "./mileage.queries";
import {
  readingFormDefaults,
  readingFormToCreateRequest,
  readingFormToUpdateRequest,
  readingToFormValues,
} from "./reading-form/mapper";
import { ReadingForm } from "./reading-form/reading-form";
import type { ReadingFormValues } from "./reading-form/schema";

/** Log a new reading (no `reading`) or edit a manual one — a bottom sheet on phones. */
export const ReadingDialog = ({
  carId,
  reading,
  latestKm,
  open,
  onOpenChange,
}: {
  carId: string;
  reading: MileagePoint | null;
  latestKm: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) => {
  const { t } = useTranslation("garageMileage");
  const format = useFormat();
  const errorMessage = useErrorMessage();
  const invalidate = useInvalidateGarage();

  const save = async (values: ReadingFormValues) => {
    try {
      await (reading === null
        ? unwrap(
            api.garage.mileage.$post({
              json: readingFormToCreateRequest(values, {
                carId,
                unit: format.unit,
              }),
            })
          )
        : unwrap(
            api.garage.mileage[":readingId"].$put({
              json: readingFormToUpdateRequest(values, format.unit),
              param: { readingId: reading.id },
            })
          ));
      await invalidate();
      toast.success(t("saved"));
      onOpenChange(false);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  return (
    <ResponsiveDialog
      description={reading === null ? t("logDescription") : undefined}
      onOpenChange={onOpenChange}
      open={open}
      title={reading === null ? t("logTitle") : t("editTitle")}
    >
      {open && (
        <ReadingForm
          defaultValues={
            reading === null
              ? readingFormDefaults(todayIso())
              : readingToFormValues(reading, format.unit)
          }
          latestKm={reading === null ? latestKm : null}
          onSubmit={save}
        />
      )}
    </ResponsiveDialog>
  );
};
