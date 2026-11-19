import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { FormDialog } from "@/components/app/form-dialog";
import { ErrorState, FormSkeleton } from "@/components/app/states";
import { api, unwrap } from "@/lib/api";
import { useErrorMessage } from "@/lib/errors";
import { useFormat } from "@/lib/format";
import { todayIso } from "@/lib/partial-date";

import { CarCrumb } from "./car-crumb";
import { carQuery, useInvalidateGarage } from "./cars.queries";
import { CarForm } from "./forms/car-form/car-form";
import {
  carFormDefaults,
  carFormToRequest,
  carToFormValues,
} from "./forms/car-form/mapper";

const NewCar = ({ onClose }: { onClose: () => Promise<void> }) => {
  const { t } = useTranslation("garage");
  const navigate = useNavigate();
  const format = useFormat();
  const errorMessage = useErrorMessage();
  const invalidate = useInvalidateGarage();

  return (
    <CarForm
      defaultValues={carFormDefaults({
        currency: format.currency,
        today: todayIso(),
        unit: format.unit,
      })}
      onCancel={() => {
        void onClose();
      }}
      onSubmit={async (values) => {
        try {
          const { id } = await unwrap(
            api.garage.cars.$post({
              json: carFormToRequest(values, format.unit),
            })
          );

          await invalidate();
          toast.success(t("carForm.created"));
          // Replace the dialog's history entry with the new car.
          await navigate({
            params: { carId: id },
            replace: true,
            to: "/garage/cars/$carId",
          });
        } catch (error) {
          toast.error(errorMessage(error));
        }
      }}
    />
  );
};

const EditCar = ({
  carId,
  onClose,
}: {
  carId: string;
  onClose: () => Promise<void>;
}) => {
  const { t } = useTranslation("garage");
  const format = useFormat();
  const errorMessage = useErrorMessage();
  const invalidate = useInvalidateGarage();
  const car = useQuery(carQuery(carId));

  if (car.isPending) {
    return <FormSkeleton fields={5} />;
  }

  if (car.isError) {
    return (
      <ErrorState
        className="m-4 md:m-4"
        error={car.error}
        onRetry={() => {
          void car.refetch();
        }}
      />
    );
  }

  return (
    <CarForm
      defaultValues={carToFormValues(car.data, {
        currency: format.currency,
        today: todayIso(),
        unit: format.unit,
      })}
      onCancel={() => {
        void onClose();
      }}
      onSubmit={async (values) => {
        try {
          await unwrap(
            api.garage.cars[":carId"].$put({
              json: carFormToRequest(values, format.unit),
              param: { carId },
            })
          );
          await invalidate();
          toast.success(t("carForm.updated"));
          await onClose();
        } catch (error) {
          toast.error(errorMessage(error));
        }
      }}
    />
  );
};

/** Add a car (no `carId`) or edit one. */
export const CarDialog = ({
  carId,
  onClose,
  onOpenChange,
  open,
}: {
  carId: string | undefined;
  onClose: () => Promise<void>;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}) => {
  const { t } = useTranslation("garage");

  return (
    <FormDialog
      crumb={carId === undefined ? undefined : <CarCrumb carId={carId} />}
      onOpenChange={onOpenChange}
      open={open}
      size="lg"
      title={
        carId === undefined ? t("carForm.createTitle") : t("carForm.editTitle")
      }
    >
      {carId === undefined ? (
        <NewCar onClose={onClose} />
      ) : (
        <EditCar carId={carId} onClose={onClose} />
      )}
    </FormDialog>
  );
};
