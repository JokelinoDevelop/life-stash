import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { FormDialog } from "@/components/app/form-dialog";
import { api, unwrap } from "@/lib/api";
import { useErrorMessage } from "@/lib/errors";
import { useFormat } from "@/lib/format";
import { todayIso } from "@/lib/partial-date";

import { CarCrumb } from "../cars/car-crumb";
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
  latest,
  onOpenChange,
  open,
  reading,
}: {
  carId: string;
  latest: { km: number; date: string } | null;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  reading: MileagePoint | null;
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

  const title = reading === null ? t("inline.dialogTitle") : t("editTitle");
  const description = reading === null ? t("logDescription") : undefined;

  const form = open && (
    <ReadingForm
      defaultValues={
        reading === null
          ? readingFormDefaults(todayIso())
          : readingToFormValues(reading, format.unit)
      }
      latest={reading === null ? latest : null}
      onCancel={() => {
        onOpenChange(false);
      }}
      onSubmit={save}
    />
  );

  return (
    <FormDialog
      crumb={<CarCrumb carId={carId} />}
      description={description}
      onOpenChange={onOpenChange}
      open={open}
      title={title}
    >
      {form}
    </FormDialog>
  );
};
