import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { BellRing } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { FormDialog } from "@/components/app/form-dialog";
import { ErrorState, FormSkeleton } from "@/components/app/states";
import { FormNotice } from "@/components/form/dialog-form";
import { api, unwrap } from "@/lib/api";
import { useErrorMessage } from "@/lib/errors";
import { useFormat } from "@/lib/format";
import { todayIso } from "@/lib/partial-date";

import { CarCrumb } from "../cars/car-crumb";
import { useInvalidateGarage } from "../cars/cars.queries";
import { reminderQuery } from "../reminders/reminders.queries";
import type { ReminderDetail } from "../reminders/reminders.queries";
import {
  visitFormDefaults,
  visitFormToCreateRequest,
  visitFormToUpdateRequest,
  visitToFormValues,
} from "./forms/visit-form/mapper";
import { VisitForm } from "./forms/visit-form/visit-form";
import { visitQuery } from "./visits.queries";

type Close = () => Promise<void>;

const NewVisitForm = ({
  carId,
  onClose,
  reminder,
}: {
  carId: string;
  onClose: Close;
  reminder: ReminderDetail | null;
}) => {
  const { t } = useTranslation("garageVisits");
  const { t: tc } = useTranslation();
  const navigate = useNavigate();
  const format = useFormat();
  const errorMessage = useErrorMessage();
  const invalidate = useInvalidateGarage();
  const suggested = reminder?.suggestedItems ?? [];

  const items =
    reminder !== null && suggested.length === 0
      ? [{ itemId: "", label: reminder.reminder.title }]
      : suggested;

  return (
    <VisitForm
      defaultValues={visitFormDefaults(
        { currency: format.currency, today: todayIso(), unit: format.unit },
        items
      )}
      notice={
        reminder === null ? undefined : (
          <FormNotice icon={<BellRing />}>
            {t("form.completing", { title: reminder.reminder.title })}
          </FormNotice>
        )
      }
      onCancel={() => {
        void onClose();
      }}
      onSubmit={async (values) => {
        try {
          const result = await unwrap(
            api.garage.visits.$post({
              json: visitFormToCreateRequest(values, {
                carId,
                reminderId: reminder?.reminder.id ?? null,
                unit: format.unit,
              }),
            })
          );

          await invalidate();
          await onClose();

          let description: string | undefined;

          if (reminder !== null) {
            description =
              result.nextReminderId === null
                ? t("form.reminderDone")
                : t("form.nextScheduled");
          }

          toast.success(t("form.created"), {
            action: {
              label: tc("actions.view"),
              onClick: () => {
                void navigate({
                  params: { carId, visitId: result.id },
                  to: "/garage/cars/$carId/services/$visitId",
                });
              },
            },
            description,
          });
        } catch (error) {
          toast.error(errorMessage(error));
        }
      }}
      showPhotosHint
    />
  );
};

const NewVisit = ({
  carId,
  onClose,
  reminderId,
}: {
  carId: string;
  onClose: Close;
  reminderId: string | undefined;
}) => {
  const reminder = useQuery({
    ...reminderQuery(reminderId ?? ""),
    enabled: reminderId !== undefined,
  });

  if (reminderId !== undefined && reminder.isPending) {
    return <FormSkeleton fields={5} />;
  }

  const open =
    reminder.data !== undefined && reminder.data.reminder.completedAt === null
      ? reminder.data
      : null;

  return <NewVisitForm carId={carId} onClose={onClose} reminder={open} />;
};

const EditVisit = ({
  onClose,
  visitId,
}: {
  onClose: Close;
  visitId: string;
}) => {
  const { t } = useTranslation("garageVisits");
  const { unit } = useFormat();
  const errorMessage = useErrorMessage();
  const invalidate = useInvalidateGarage();
  const visit = useQuery(visitQuery(visitId));

  if (visit.isPending) {
    return <FormSkeleton fields={5} />;
  }

  if (visit.isError) {
    return (
      <ErrorState
        className="m-4 md:m-4"
        error={visit.error}
        onRetry={() => {
          void visit.refetch();
        }}
      />
    );
  }

  return (
    <VisitForm
      defaultValues={visitToFormValues(visit.data.visit, unit)}
      onCancel={() => {
        void onClose();
      }}
      onSubmit={async (values) => {
        try {
          await unwrap(
            api.garage.visits[":visitId"].$put({
              json: visitFormToUpdateRequest(values, unit),
              param: { visitId },
            })
          );
          await invalidate();
          toast.success(t("form.updated"));
          await onClose();
        } catch (error) {
          toast.error(errorMessage(error));
        }
      }}
      showPhotosHint={false}
    />
  );
};

/** Log a service visit (optionally completing a reminder) or edit one. */
export const VisitDialog = ({
  carId,
  onClose,
  onOpenChange,
  open,
  reminderId,
  visitId,
}: {
  carId: string;
  onClose: Close;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  reminderId: string | undefined;
  visitId: string | undefined;
}) => {
  const { t } = useTranslation("garageVisits");

  return (
    <FormDialog
      crumb={<CarCrumb carId={carId} />}
      onOpenChange={onOpenChange}
      open={open}
      size="lg"
      title={
        visitId === undefined ? t("form.createTitle") : t("form.editTitle")
      }
    >
      {visitId === undefined ? (
        <NewVisit carId={carId} onClose={onClose} reminderId={reminderId} />
      ) : (
        <EditVisit onClose={onClose} visitId={visitId} />
      )}
    </FormDialog>
  );
};
