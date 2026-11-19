import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { FormDialog } from "@/components/app/form-dialog";
import { ErrorState, FormSkeleton } from "@/components/app/states";

import { useCreateCategory, useUpdateCategory } from "./categories.mutations";
import { categoriesQuery } from "./categories.queries";
import { CategoryForm } from "./forms/category-form/category-form";
import {
  categoryFormDefaults,
  categoryFormToCreateRequest,
  categoryFormToUpdateRequest,
  categoryToFormValues,
} from "./forms/category-form/mapper";

type Close = () => Promise<void>;

const CategoryBody = ({
  categoryId,
  kind,
  onClose,
}: {
  categoryId: string | undefined;
  kind: "income" | "expense";
  onClose: Close;
}) => {
  const { t } = useTranslation("finances");
  const categories = useQuery(categoriesQuery);
  const create = useCreateCategory();
  const update = useUpdateCategory(t("categories.updated"));

  if (categoryId === undefined) {
    return (
      <CategoryForm
        defaultValues={categoryFormDefaults(kind)}
        onCancel={() => {
          void onClose();
        }}
        onSubmit={async (values) => {
          await create.mutateAsync(categoryFormToCreateRequest(values, kind));
          await onClose();
        }}
      />
    );
  }

  if (categories.isPending) {
    return <FormSkeleton fields={2} />;
  }

  const category = categories.data?.categories.find(
    (row) => row.id === categoryId
  );

  if (categories.isError || category === undefined) {
    return (
      <ErrorState
        className="m-4 md:m-4"
        error={categories.error}
        onRetry={() => {
          void categories.refetch();
        }}
      />
    );
  }

  return (
    <CategoryForm
      defaultValues={categoryToFormValues(category)}
      onCancel={() => {
        void onClose();
      }}
      onSubmit={async (values) => {
        await update.mutateAsync({
          id: categoryId,
          json: categoryFormToUpdateRequest(values),
        });
        await onClose();
      }}
    />
  );
};

/** New category (of `kind`) or rename / change icon (`?dialog=category&id=…`). */
export const CategoryDialog = ({
  categoryId,
  kind,
  onClose,
  onOpenChange,
  open,
}: {
  categoryId: string | undefined;
  kind: "income" | "expense" | undefined;
  onClose: Close;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}) => {
  const { t } = useTranslation("finances");

  return (
    <FormDialog
      crumb={<span>{t("title")}</span>}
      onOpenChange={onOpenChange}
      open={open}
      title={
        categoryId === undefined
          ? t("categories.newTitle")
          : t("categories.editTitle")
      }
    >
      <CategoryBody
        categoryId={categoryId}
        kind={kind ?? "expense"}
        onClose={onClose}
      />
    </FormDialog>
  );
};
