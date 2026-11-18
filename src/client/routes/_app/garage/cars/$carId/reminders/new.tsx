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
  reminderFormDefaults,
  reminderFormToCreateRequest,
} from "@/modules/garage/reminders/forms/reminder-form/mapper";
import { ReminderForm } from "@/modules/garage/reminders/forms/reminder-form/reminder-form";

const NewReminderPage = () => {
  const { carId } = Route.useParams();
  const { t } = useTranslation("garageReminders");
  const navigate = useNavigate();
  const { unit } = useFormat();
  const errorMessage = useErrorMessage();
  const invalidate = useInvalidateGarage();

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
        title={t("form.createTitle")}
      />
      <ReminderForm
        defaultValues={reminderFormDefaults}
        onSubmit={async (values) => {
          try {
            await unwrap(
              api.garage.reminders.$post({
                json: reminderFormToCreateRequest(values, { carId, unit }),
              })
            );
            await invalidate();
            toast.success(t("form.created"));
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

export const Route = createFileRoute("/_app/garage/cars/$carId/reminders/new")({
  component: NewReminderPage,
});
