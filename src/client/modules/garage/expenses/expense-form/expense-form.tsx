import { EXPENSE_CATEGORIES } from "@shared/domain/garage-kinds";
import { CURRENCIES } from "@shared/domain/money";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { DialogForm, FormSection } from "@/components/form/dialog-form";
import { useAppForm } from "@/components/form/form-hook";
import { FieldGroup } from "@/components/ui/field";
import { useFormat } from "@/lib/format";

import { expenseFormSchema } from "./schema";
import type { ExpenseFormValues } from "./schema";

export const ExpenseForm = ({
  defaultValues,
  footerStart,
  notice,
  onCancel,
  onSubmit,
}: {
  defaultValues: ExpenseFormValues;
  /** Left side of the footer, e.g. Delete when editing. */
  footerStart?: ReactNode;
  /** A line above the fields, e.g. which reminder this completes. */
  notice?: ReactNode;
  onCancel: () => void;
  onSubmit: (values: ExpenseFormValues) => Promise<void>;
}) => {
  const { t } = useTranslation("garageExpenses");
  const { t: tc } = useTranslation();
  const { unit } = useFormat();

  const form = useAppForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      await onSubmit(value);
    },
    validators: { onSubmit: expenseFormSchema },
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
        <FieldGroup>
          <form.AppField name="category">
            {(field) => (
              <field.SelectField
                label={t("fields.category")}
                options={EXPENSE_CATEGORIES.map((category) => ({
                  label: t(`categories.${category}`),
                  value: category,
                }))}
              />
            )}
          </form.AppField>
          <div className="grid grid-cols-[1fr_auto] gap-3">
            <form.AppField name="amount">
              {(field) => (
                <field.TextField
                  autoFocus
                  inputMode="decimal"
                  label={t("fields.amount")}
                />
              )}
            </form.AppField>
            <form.AppField name="currency">
              {(field) => (
                <field.SelectField
                  label={t("fields.currency")}
                  options={CURRENCIES.map((code) => ({
                    label: code,
                    value: code,
                  }))}
                />
              )}
            </form.AppField>
          </div>
          <form.AppField name="date">
            {(field) => <field.DateField label={t("fields.date")} />}
          </form.AppField>
          <div className="grid gap-4 sm:grid-cols-2">
            <form.AppField name="odometer">
              {(field) => (
                <field.TextField
                  inputMode="numeric"
                  label={t("fields.odometer")}
                  optional
                  suffix={tc(`units.${unit}`)}
                />
              )}
            </form.AppField>
            <form.Subscribe selector={(state) => state.values.category}>
              {(category) =>
                category === "fuel" && (
                  <form.AppField name="quantity">
                    {(field) => (
                      <field.TextField
                        inputMode="decimal"
                        label={t("fields.quantity")}
                        optional
                        suffix="L"
                      />
                    )}
                  </form.AppField>
                )
              }
            </form.Subscribe>
          </div>
          <form.AppField name="notes">
            {(field) => (
              <field.TextareaField label={t("fields.notes")} optional />
            )}
          </form.AppField>
        </FieldGroup>
      </FormSection>
    </DialogForm>
  );
};
