import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { BackLink } from "@/components/app/back-link";
import { ConfirmDialog } from "@/components/app/confirm-dialog";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { api, unwrap } from "@/lib/api";
import { useErrorMessage } from "@/lib/errors";
import { useFormat } from "@/lib/format";
import { useInvalidateGarage } from "@/modules/garage/cars/cars.queries";
import { ExpenseForm } from "@/modules/garage/expenses/expense-form/expense-form";
import {
  expenseFormToUpdateRequest,
  expenseToFormValues,
} from "@/modules/garage/expenses/expense-form/mapper";
import { expenseQuery } from "@/modules/garage/expenses/expenses.queries";

const EditExpensePage = () => {
  const { carId, expenseId } = Route.useParams();
  const { t } = useTranslation("garageExpenses");
  const { t: tc } = useTranslation();
  const navigate = useNavigate();
  const format = useFormat();
  const errorMessage = useErrorMessage();
  const invalidate = useInvalidateGarage();
  const { data } = useSuspenseQuery(expenseQuery(expenseId));

  const backToList = async () => {
    await navigate({
      params: { carId },
      search: { tab: "expenses" },
      to: "/garage/cars/$carId",
    });
  };

  return (
    <>
      <PageHeader
        actions={
          <ConfirmDialog
            onConfirm={async () => {
              try {
                await unwrap(
                  api.garage.expenses[":expenseId"].$delete({
                    param: { expenseId },
                  })
                );
                await invalidate();
                toast.success(t("deleted"));
                await backToList();
              } catch (error) {
                toast.error(errorMessage(error));
              }
            }}
            trigger={
              <Button variant="outline">
                <Trash2 />
                {tc("actions.delete")}
              </Button>
            }
          />
        }
        back={
          <BackLink
            params={{ carId }}
            search={{ tab: "expenses" }}
            to="/garage/cars/$carId"
          />
        }
        title={t("editTitle")}
      />
      <ExpenseForm
        defaultValues={expenseToFormValues(data.expense, format.unit)}
        onSubmit={async (values) => {
          try {
            await unwrap(
              api.garage.expenses[":expenseId"].$put({
                json: expenseFormToUpdateRequest(values, format.unit),
                param: { expenseId },
              })
            );
            await invalidate();
            toast.success(t("updated"));
            await backToList();
          } catch (error) {
            toast.error(errorMessage(error));
          }
        }}
      />
    </>
  );
};

export const Route = createFileRoute(
  "/_app/garage/cars/$carId/expenses/$expenseId/edit"
)({
  loader: async ({ context, params }) => {
    await context.queryClient.query(expenseQuery(params.expenseId));
  },
  component: EditExpensePage,
});
