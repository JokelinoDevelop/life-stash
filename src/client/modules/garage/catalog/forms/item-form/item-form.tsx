import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { DialogForm, FormSection } from "@/components/form/dialog-form";
import { useAppForm } from "@/components/form/form-hook";

import { itemFormSchema } from "./schema";
import type { ItemFormValues } from "./schema";

export const ItemForm = ({
  defaultValues,
  footerStart,
  notice,
  onCancel,
  onSubmit,
}: {
  defaultValues: ItemFormValues;
  /** Left side of the footer, e.g. Archive. */
  footerStart?: ReactNode;
  /** A strip above the fields, e.g. "archived" or usage. */
  notice?: ReactNode;
  onCancel: () => void;
  onSubmit: (values: ItemFormValues) => Promise<void>;
}) => {
  const { t } = useTranslation("garageCatalog");

  const form = useAppForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      await onSubmit(value);
    },
    validators: { onSubmit: itemFormSchema },
  });

  return (
    <DialogForm
      footer={
        <form.AppForm>
          <form.FormFooter onCancel={onCancel} start={footerStart} />
        </form.AppForm>
      }
      onSubmit={() => {
        void form.handleSubmit();
      }}
    >
      {notice}
      <FormSection>
        <form.AppField name="name">
          {(field) => (
            <field.TextField
              description={t("items.nameDescription")}
              label={t("items.name")}
              placeholder={t("items.namePlaceholder")}
            />
          )}
        </form.AppField>
      </FormSection>
    </DialogForm>
  );
};
