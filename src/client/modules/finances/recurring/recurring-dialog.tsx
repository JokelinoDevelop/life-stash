import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { FormDialog } from "@/components/app/form-dialog";
import { ErrorState, FormSkeleton } from "@/components/app/states";
import { useFormat } from "@/lib/format";
import { todayIso } from "@/lib/partial-date";

import { categoriesQuery } from "../categories/categories.queries";
import { useCategoryName } from "../categories/category-label";
import { clientsQuery } from "../clients/clients.queries";
import {
  recurringFormDefaults,
  recurringFormToRequest,
  recurringToFormValues,
} from "./forms/recurring-form/mapper";
import { RecurringForm } from "./forms/recurring-form/recurring-form";
import {
  recurringQuery,
  useCreateRecurring,
  useUpdateRecurring,
} from "./recurring.queries";

type Close = () => Promise<void>;

const RecurringBody = ({
  onClose,
  recurringId,
}: {
  onClose: Close;
  recurringId: string | undefined;
}) => {
  const { t } = useTranslation("finances");
  const format = useFormat();
  const nameOf = useCategoryName();
  const categories = useQuery(categoriesQuery);
  const clients = useQuery(clientsQuery(Number(todayIso().slice(0, 4))));
  const items = useQuery(recurringQuery);
  const create = useCreateRecurring();
  const update = useUpdateRecurring(t("recurring.updated"));

  if (categories.isPending || clients.isPending || items.isPending) {
    return <FormSkeleton fields={5} />;
  }

  const existing = items.data?.recurring.find(
    (item) => item.id === recurringId
  );

  if (
    categories.isError ||
    (recurringId !== undefined && existing === undefined)
  ) {
    return (
      <ErrorState
        className="m-4 md:m-4"
        error={categories.error ?? items.error}
        onRetry={() => {
          void items.refetch();
        }}
      />
    );
  }

  const income = categories.data.categories.filter(
    (category) =>
      category.kind === "income" &&
      category.systemKey === null &&
      (!category.archived || category.id === existing?.category.id)
  );

  const salary =
    income.find((category) => category.icon === "briefcase") ?? income[0];

  const clientOptions = (clients.data?.clients ?? []).filter(
    (client) => !client.archived || client.id === existing?.client?.id
  );

  return (
    <RecurringForm
      categories={income.map((category) => ({
        id: category.id,
        name: nameOf(category),
      }))}
      clients={clientOptions}
      defaultValues={
        existing === undefined
          ? recurringFormDefaults({
              categoryId: salary?.id ?? "",
              currency: format.currency,
            })
          : recurringToFormValues(existing)
      }
      onCancel={() => {
        void onClose();
      }}
      onSubmit={async (values) => {
        const json = recurringFormToRequest(values);

        await (existing === undefined
          ? create.mutateAsync(json)
          : update.mutateAsync({ id: existing.id, json }));
        await onClose();
      }}
    />
  );
};

/** `?dialog=recurring` (+ `id` to edit). */
export const RecurringDialog = ({
  onClose,
  onOpenChange,
  open,
  recurringId,
}: {
  onClose: Close;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  recurringId: string | undefined;
}) => {
  const { t } = useTranslation("finances");

  return (
    <FormDialog
      crumb={<span>{t("title")}</span>}
      onOpenChange={onOpenChange}
      open={open}
      title={
        recurringId === undefined
          ? t("recurring.newTitle")
          : t("recurring.editTitle")
      }
    >
      <RecurringBody onClose={onClose} recurringId={recurringId} />
    </FormDialog>
  );
};
