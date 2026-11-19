import { useQuery } from "@tanstack/react-query";
import { BellRing, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/app/confirm-dialog";
import { FormDialog } from "@/components/app/form-dialog";
import { ErrorState, FormSkeleton } from "@/components/app/states";
import { FormNotice } from "@/components/form/dialog-form";
import { Button } from "@/components/ui/button";
import { api, unwrap } from "@/lib/api";
import { useErrorMessage } from "@/lib/errors";
import { useFormat } from "@/lib/format";
import { todayIso } from "@/lib/partial-date";

import { CarCrumb } from "../cars/car-crumb";
import { useInvalidateGarage } from "../cars/cars.queries";
import { reminderQuery } from "../reminders/reminders.queries";
import { ExpenseForm } from "./expense-form/expense-form";
import {
  expenseFormDefaults,
  expenseFormToCreateRequest,
  expenseFormToUpdateRequest,
  expenseToFormValues,
} from "./expense-form/mapper";
import { expenseQuery } from "./expenses.queries";
import { categoryForReminder } from "./reminder-category";

type Close = () => Promise<void>;

const NewExpense = ({
  carId,
  onClose,
  reminderId,
}: {
  carId: string;
  onClose: Close;
  reminderId: string | undefined;
}) => {
  const { t } = useTranslation("garageExpenses");
  const format = useFormat();
  const errorMessage = useErrorMessage();
  const invalidate = useInvalidateGarage();

  const reminder = useQuery({
    ...reminderQuery(reminderId ?? ""),
    enabled: reminderId !== undefined,
  });

  if (reminderId !== undefined && reminder.isPending) {
    return <FormSkeleton />;
  }

  const completing =
    reminderId !== undefined && reminder.data?.reminder.completedAt === null
      ? reminder.data.reminder
      : undefined;

  const linkedReminderId = completing === undefined ? null : reminderId;

  return (
    <ExpenseForm
      defaultValues={expenseFormDefaults({
        category: categoryForReminder(completing?.kind),
        currency: format.currency,
        today: todayIso(),
      })}
      notice={
        completing === undefined ? undefined : (
          <FormNotice icon={<BellRing />}>
            {t("completing", { title: completing.title })}
          </FormNotice>
        )
      }
      onCancel={() => {
        void onClose();
      }}
      onSubmit={async (values) => {
        try {
          await unwrap(
            api.garage.expenses.$post({
              json: expenseFormToCreateRequest(values, {
                carId,
                reminderId: linkedReminderId ?? null,
                unit: format.unit,
              }),
            })
          );
          await invalidate();
          toast.success(t("created"));
          await onClose();
        } catch (error) {
          toast.error(errorMessage(error));
        }
      }}
    />
  );
};

const DeleteExpenseButton = ({
  expenseId,
  onClose,
}: {
  expenseId: string;
  onClose: Close;
}) => {
  const { t } = useTranslation("garageExpenses");
  const { t: tc } = useTranslation();
  const errorMessage = useErrorMessage();
  const invalidate = useInvalidateGarage();

  return (
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
          await onClose();
        } catch (error) {
          toast.error(errorMessage(error));
          throw error;
        }
      }}
      trigger={
        <Button
          aria-label={tc("actions.delete")}
          size="icon-compact"
          type="button"
          variant="ghost"
        >
          <Trash2 />
        </Button>
      }
    />
  );
};

const EditExpense = ({
  expenseId,
  onClose,
}: {
  expenseId: string;
  onClose: Close;
}) => {
  const { t } = useTranslation("garageExpenses");
  const format = useFormat();
  const errorMessage = useErrorMessage();
  const invalidate = useInvalidateGarage();
  const expense = useQuery(expenseQuery(expenseId));

  if (expense.isPending) {
    return <FormSkeleton />;
  }

  if (expense.isError) {
    return (
      <ErrorState
        className="m-4 md:m-4"
        error={expense.error}
        onRetry={() => {
          void expense.refetch();
        }}
      />
    );
  }

  return (
    <ExpenseForm
      defaultValues={expenseToFormValues(expense.data.expense, format.unit)}
      footerStart={
        <DeleteExpenseButton expenseId={expenseId} onClose={onClose} />
      }
      onCancel={() => {
        void onClose();
      }}
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
          await onClose();
        } catch (error) {
          toast.error(errorMessage(error));
        }
      }}
    />
  );
};

/** Add an expense (optionally completing a reminder) or edit one. */
export const ExpenseDialog = ({
  carId,
  expenseId,
  onClose,
  onOpenChange,
  open,
  reminderId,
}: {
  carId: string;
  expenseId: string | undefined;
  onClose: Close;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  reminderId: string | undefined;
}) => {
  const { t } = useTranslation("garageExpenses");

  return (
    <FormDialog
      crumb={<CarCrumb carId={carId} />}
      onOpenChange={onOpenChange}
      open={open}
      title={expenseId === undefined ? t("createTitle") : t("editTitle")}
    >
      {expenseId === undefined ? (
        <NewExpense carId={carId} onClose={onClose} reminderId={reminderId} />
      ) : (
        <EditExpense expenseId={expenseId} onClose={onClose} />
      )}
    </FormDialog>
  );
};
