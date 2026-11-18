import { useTranslation } from "react-i18next";

import { useAppForm } from "@/components/form/form-hook";

import { itemFormSchema } from "./schema";
import type { ItemFormValues } from "./schema";

export const ItemForm = ({
  defaultValues,
  submitLabel,
  onSubmit,
}: {
  defaultValues: ItemFormValues;
  submitLabel?: string;
  onSubmit: (values: ItemFormValues) => Promise<void>;
}) => {
  const { t } = useTranslation("garageCatalog");

  const form = useAppForm({
    defaultValues,
    onSubmit: async ({ value, formApi }) => {
      await onSubmit(value);
      formApi.reset();
    },
    validators: { onSubmit: itemFormSchema },
  });

  return (
    <form
      className="flex items-end gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
    >
      <div className="flex-1">
        <form.AppField name="name">
          {(field) => (
            <field.TextField
              label={t("items.name")}
              placeholder={t("items.namePlaceholder")}
            />
          )}
        </form.AppField>
      </div>
      <form.AppForm>
        <form.SubmitButton label={submitLabel} />
      </form.AppForm>
    </form>
  );
};
