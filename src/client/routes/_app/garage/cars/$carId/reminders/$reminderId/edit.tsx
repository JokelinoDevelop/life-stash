import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { BackLink } from "@/components/app/back-link";
import { PageHeader } from "@/components/app/page-header";
import { api, unwrap } from "@/lib/api";
import { useErrorMessage } from "@/lib/errors";
import { useFormat } from "@/lib/format";
import { useInvalidateGarage } from "@/modules/garage/cars/cars.queries";
import {
  reminderFormToUpdateRequest,
  reminderToFormValues,
} from "@/modules/garage/reminders/forms/reminder-form/mapper";
import { ReminderForm } from "@/modules/garage/reminders/forms/reminder-form/reminder-form";
import { reminderQuery } from "@/modules/garage/reminders/reminders.queries";

const EditReminderPage = () => {
  const { carId, reminderId } = Route.useParams();
  const { t } = useTranslation("garageReminders");
  const navigate = useNavigate();
  const { unit } = useFormat();
  const errorMessage = useErrorMessage();
  const invalidate = useInvalidateGarage();
  const { data } = useSuspenseQuery(reminderQuery(reminderId));

  return (
    <>
      <PageHeader
        back={
          <BackLink
            params={{ carId }}
            search={{ tab: "reminders" }}
            to="/garage/cars/$carId"
          />
        }
        title={t("form.editTitle")}
      />
      <ReminderForm
        defaultValues={reminderToFormValues(data, unit)}
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
            await navigate({
              params: { carId },
              search: { tab: "reminders" },
              to: "/garage/cars/$carId",
            });
          } catch (error) {
            toast.error(errorMessage(error));
          }
        }}
      />
    </>
  );
};

export const Route = createFileRoute(
  "/_app/garage/cars/$carId/reminders/$reminderId/edit"
)({
  loader: async ({ context, params }) => {
    await context.queryClient.query(reminderQuery(params.reminderId));
  },
  component: EditReminderPage,
});
