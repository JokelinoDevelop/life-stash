import { CURRENCIES } from "@shared/domain/money";
import { useTranslation } from "react-i18next";

import { DialogForm, FormSection } from "@/components/form/dialog-form";
import { useAppForm } from "@/components/form/form-hook";
import { FieldGroup } from "@/components/ui/field";

import { NO_CLIENT } from "./mapper";
import { recurringFormSchema } from "./schema";
import type { RecurringFormValues } from "./schema";

interface Option {
  id: string;
  name: string;
}

/** Recurring income: what, how much, which category and client, which day. */
export const RecurringForm = ({
  categories,
  clients,
  defaultValues,
  onCancel,
  onSubmit,
}: {
  categories: readonly Option[];
  clients: readonly Option[];
  defaultValues: RecurringFormValues;
  onCancel: () => void;
  onSubmit: (values: RecurringFormValues) => Promise<void>;
}) => {
  const { t } = useTranslation("finances");

  const form = useAppForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      await onSubmit(value);
    },
    validators: { onSubmit: recurringFormSchema },
  });

  return (
    <DialogForm
      footer={
        <form.AppForm>
          <form.FormFooter onCancel={onCancel} />
        </form.AppForm>
      }
      onSubmit={() => {
        void form.handleSubmit();
      }}
    >
      <FormSection>
        <FieldGroup>
          <form.AppField name="description">
            {(field) => (
              <field.TextField
                autoFocus
                label={t("recurring.form.description")}
                placeholder={t("recurring.form.descriptionPlaceholder")}
              />
            )}
          </form.AppField>
          <div className="grid grid-cols-[1fr_auto] gap-3">
            <form.AppField name="amount">
              {(field) => (
                <field.TextField
                  inputMode="decimal"
                  label={t("recurring.form.amount")}
                />
              )}
            </form.AppField>
            <form.AppField name="currency">
              {(field) => (
                <field.SelectField
                  label={t("recurring.form.currency")}
                  options={CURRENCIES.map((code) => ({
                    label: code,
                    value: code,
                  }))}
                />
              )}
            </form.AppField>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <form.AppField name="categoryId">
              {(field) => (
                <field.SelectField
                  label={t("recurring.form.category")}
                  options={categories.map((category) => ({
                    label: category.name,
                    value: category.id,
                  }))}
                />
              )}
            </form.AppField>
            <form.AppField name="clientId">
              {(field) => (
                <field.SelectField
                  label={t("recurring.form.client")}
                  options={[
                    { label: t("recurring.form.noClient"), value: NO_CLIENT },
                    ...clients.map((client) => ({
                      label: client.name,
                      value: client.id,
                    })),
                  ]}
                />
              )}
            </form.AppField>
          </div>
          <form.AppField name="dayOfMonth">
            {(field) => (
              <field.TextField
                description={t("recurring.form.dayHint")}
                inputMode="numeric"
                label={t("recurring.form.day")}
              />
            )}
          </form.AppField>
          <form.AppField name="active">
            {(field) => (
              <field.SwitchField label={t("recurring.form.active")} />
            )}
          </form.AppField>
        </FieldGroup>
      </FormSection>
    </DialogForm>
  );
};
