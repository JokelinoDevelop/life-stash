import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod";

import { BackLink } from "@/components/app/back-link";
import { PageHeader } from "@/components/app/page-header";
import { LoadingState } from "@/components/app/states";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { api, unwrap } from "@/lib/api";
import { useErrorMessage } from "@/lib/errors";
import { useFormat } from "@/lib/format";
import { todayIso } from "@/lib/partial-date";
import {
  carOverviewQuery,
  useInvalidateGarage,
} from "@/modules/garage/cars/cars.queries";
import { ExpenseForm } from "@/modules/garage/expenses/expense-form/expense-form";
import {
  expenseFormDefaults,
  expenseFormToCreateRequest,
} from "@/modules/garage/expenses/expense-form/mapper";
import { categoryForReminder } from "@/modules/garage/expenses/reminder-category";

const NewExpensePage = () => {
  const { carId } = Route.useParams();
  const { reminderId } = Route.useSearch();
  const { t } = useTranslation("garageExpenses");
  const navigate = useNavigate();
  const format = useFormat();
  const errorMessage = useErrorMessage();
  const invalidate = useInvalidateGarage();

  const overview = useQuery({
    ...carOverviewQuery(carId),
    enabled: reminderId !== undefined,
  });

  const reminder = overview.data?.dueReminders.find(
    (entry) => entry.id === reminderId
  );

  const back = (
    <BackLink
      params={{ carId }}
      search={{ tab: "expenses" }}
      to="/garage/cars/$carId"
    />
  );

  if (reminderId !== undefined && overview.isPending) {
    return <LoadingState rows={2} />;
  }

  return (
    <>
      <PageHeader back={back} title={t("createTitle")} />
      {reminderId !== undefined && (
        <Alert className="mb-4">
          <AlertDescription>
            {reminder === undefined
              ? t("completingGeneric")
              : t("completing", { title: reminder.title })}
          </AlertDescription>
        </Alert>
      )}
      <ExpenseForm
        defaultValues={expenseFormDefaults({
          category: categoryForReminder(
            reminder?.kind ?? (reminderId === undefined ? undefined : "other")
          ),
          currency: format.currency,
          today: todayIso(),
        })}
        onSubmit={async (values) => {
          try {
            await unwrap(
              api.garage.expenses.$post({
                json: expenseFormToCreateRequest(values, {
                  carId,
                  reminderId: reminderId ?? null,
                  unit: format.unit,
                }),
              })
            );
            await invalidate();
            toast.success(t("created"));
            await navigate({
              params: { carId },
              search: {
                tab: reminderId === undefined ? "expenses" : "reminders",
              },
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

export const Route = createFileRoute("/_app/garage/cars/$carId/expenses/new")({
  validateSearch: z.object({ reminderId: z.uuid().optional() }),
  component: NewExpensePage,
});
