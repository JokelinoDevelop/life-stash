import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod";

import { BackLink } from "@/components/app/back-link";
import { PageContent, PageHeader } from "@/components/app/page-header";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { api, unwrap } from "@/lib/api";
import { useErrorMessage } from "@/lib/errors";
import { useFormat } from "@/lib/format";
import { todayIso } from "@/lib/partial-date";
import { useInvalidateGarage } from "@/modules/garage/cars/cars.queries";
import { reminderQuery } from "@/modules/garage/reminders/reminders.queries";
import type { ReminderDetail } from "@/modules/garage/reminders/reminders.queries";
import {
  visitFormDefaults,
  visitFormToCreateRequest,
} from "@/modules/garage/visits/forms/visit-form/mapper";
import type { VisitFormValues } from "@/modules/garage/visits/forms/visit-form/schema";
import { VisitForm } from "@/modules/garage/visits/forms/visit-form/visit-form";

const NewVisit = ({
  carId,
  reminder,
}: {
  carId: string;
  reminder: ReminderDetail | null;
}) => {
  const { t } = useTranslation("garageVisits");
  const navigate = useNavigate();
  const format = useFormat();
  const errorMessage = useErrorMessage();
  const invalidate = useInvalidateGarage();
  const suggested = reminder?.suggestedItems ?? [];

  const items =
    reminder !== null && suggested.length === 0
      ? [{ itemId: "", label: reminder.reminder.title }]
      : suggested;

  const defaults: VisitFormValues = visitFormDefaults(
    { currency: format.currency, today: todayIso(), unit: format.unit },
    items
  );

  const submit = async (values: VisitFormValues) => {
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
      toast.success(t("form.created"));

      if (reminder !== null) {
        toast.success(
          result.nextReminderId === null
            ? t("form.reminderDone")
            : t("form.nextScheduled")
        );
      }

      await navigate({
        params: { carId, visitId: result.id },
        to: "/garage/cars/$carId/services/$visitId",
      });
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  return (
    <>
      {reminder !== null && (
        <div className="mb-4">
          <Alert>
            <AlertDescription>
              {t("form.completing", { title: reminder.reminder.title })}
            </AlertDescription>
          </Alert>
        </div>
      )}
      <VisitForm defaultValues={defaults} onSubmit={submit} showPhotosHint />
    </>
  );
};

const NewVisitFromReminder = ({
  carId,
  reminderId,
}: {
  carId: string;
  reminderId: string;
}) => {
  const { data } = useSuspenseQuery(reminderQuery(reminderId));

  return (
    <NewVisit
      carId={carId}
      reminder={data.reminder.completedAt === null ? data : null}
    />
  );
};

const NewVisitPage = () => {
  const { carId } = Route.useParams();
  const { reminderId } = Route.useSearch();
  const { t } = useTranslation("garageVisits");

  return (
    <>
      <PageHeader
        back={
          <BackLink
            params={{ carId }}
            search={{ tab: "history" }}
            to="/garage/cars/$carId"
          />
        }
        title={t("form.createTitle")}
      />
      <PageContent>
        {reminderId === undefined ? (
          <NewVisit carId={carId} reminder={null} />
        ) : (
          <NewVisitFromReminder carId={carId} reminderId={reminderId} />
        )}
      </PageContent>
    </>
  );
};

export const Route = createFileRoute("/_app/garage/cars/$carId/services/new")({
  validateSearch: z.object({ reminderId: z.uuid().optional() }),
  component: NewVisitPage,
});
