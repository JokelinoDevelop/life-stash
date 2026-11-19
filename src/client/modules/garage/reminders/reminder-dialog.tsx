import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { FormDialog } from "@/components/app/form-dialog";
import { ErrorState, FormSkeleton } from "@/components/app/states";
import { api, unwrap } from "@/lib/api";
import { useErrorMessage } from "@/lib/errors";
import { useFormat } from "@/lib/format";

import { CarCrumb } from "../cars/car-crumb";
import { useInvalidateGarage } from "../cars/cars.queries";
import {
  reminderFormDefaults,
  reminderFormToCreateRequest,
  reminderFormToUpdateRequest,
  reminderToFormValues,
} from "./forms/reminder-form/mapper";
import { ReminderForm } from "./forms/reminder-form/reminder-form";
import { reminderQuery } from "./reminders.queries";

type Close = () => Promise<void>;

const NewReminder = ({ carId, onClose }: { carId: string; onClose: Close }) => {
  const { t } = useTranslation("garageReminders");
  const { unit } = useFormat();
  const errorMessage = useErrorMessage();
  const invalidate = useInvalidateGarage();

  return (
    <ReminderForm
      defaultValues={reminderFormDefaults}
      onCancel={() => {
        void onClose();
      }}
      onSubmit={async (values) => {
        try {
          await unwrap(
            api.garage.reminders.$post({
              json: reminderFormToCreateRequest(values, { carId, unit }),
            })
          );
          await invalidate();
          toast.success(t("form.created"));
          await onClose();
        } catch (error) {
          toast.error(errorMessage(error));
        }
      }}
    />
  );
};

const EditReminder = ({
  onClose,
  reminderId,
}: {
  onClose: Close;
  reminderId: string;
}) => {
  const { t } = useTranslation("garageReminders");
  const { unit } = useFormat();
  const errorMessage = useErrorMessage();
  const invalidate = useInvalidateGarage();
  const reminder = useQuery(reminderQuery(reminderId));

  if (reminder.isPending) {
    return <FormSkeleton fields={5} />;
  }

  if (reminder.isError) {
    return (
      <ErrorState
        className="m-4 md:m-4"
        error={reminder.error}
        onRetry={() => {
          void reminder.refetch();
        }}
      />
    );
  }

  return (
    <ReminderForm
      defaultValues={reminderToFormValues(reminder.data, unit)}
      onCancel={() => {
        void onClose();
      }}
      onSubmit={async (values) => {
        try {
          await unwrap(
            api.garage.reminders[":reminderId"].$put({
              json: reminderFormToUpdateRequest(values, unit),
              param: { reminderId },
            })
          );
          await invalidate();
          toast.success(t("form.updated"));
          await onClose();
        } catch (error) {
          toast.error(errorMessage(error));
        }
      }}
    />
  );
};

/** Add a reminder or edit one. */
export const ReminderDialog = ({
  carId,
  onClose,
  onOpenChange,
  open,
  reminderId,
}: {
  carId: string;
  onClose: Close;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  reminderId: string | undefined;
}) => {
  const { t } = useTranslation("garageReminders");

  return (
    <FormDialog
      crumb={<CarCrumb carId={carId} />}
      onOpenChange={onOpenChange}
      open={open}
      title={
        reminderId === undefined ? t("form.createTitle") : t("form.editTitle")
      }
    >
      {reminderId === undefined ? (
        <NewReminder carId={carId} onClose={onClose} />
      ) : (
        <EditReminder onClose={onClose} reminderId={reminderId} />
      )}
    </FormDialog>
  );
};
