import { EXPENSE_CATEGORIES } from "@shared/domain/garage-kinds";
import type { ExpenseCategory } from "@shared/domain/garage-kinds";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { AmountInput } from "@/components/form/amount-input";
import { DatePicker } from "@/components/form/date-picker";
import { DialogForm, FormSection } from "@/components/form/dialog-form";
import { useAppForm } from "@/components/form/form-hook";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { useFormat } from "@/lib/format";

import { expenseFormSchema } from "./schema";
import type { ExpenseFormValues } from "./schema";

const CategoryChips = ({
  onChange,
  value,
}: {
  onChange: (category: ExpenseCategory) => void;
  value: ExpenseCategory;
}) => {
  const { t } = useTranslation("garageExpenses");

  return (
    <fieldset className="mt-4 flex flex-wrap gap-1.5">
      <legend className="sr-only">{t("fields.category")}</legend>
      {EXPENSE_CATEGORIES.map((category) => (
        <Button
          aria-pressed={value === category}
          key={category}
          onClick={() => {
            onChange(category);
          }}
          size="chip"
          type="button"
          variant="chip"
        >
          {t(`categories.${category}`)}
        </Button>
      ))}
    </fieldset>
  );
};

/** Amount first, then what it was for and when (same order as Finances › Add transaction), then car details. */
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
        <form.Subscribe selector={(state) => state.values.currency}>
          {(currency) => (
            <form.Field name="amount">
              {(field) => (
                <AmountInput
                  amount={field.state.value}
                  currency={currency}
                  errors={field.state.meta.errors}
                  income={false}
                  invalid={
                    field.state.meta.isTouched && !field.state.meta.isValid
                  }
                  onAmountBlur={field.handleBlur}
                  onAmountChange={field.handleChange}
                  onCurrencyChange={(value) => {
                    form.setFieldValue("currency", value);
                  }}
                />
              )}
            </form.Field>
          )}
        </form.Subscribe>
        <form.Field name="category">
          {(field) => (
            <CategoryChips
              onChange={field.handleChange}
              value={field.state.value}
            />
          )}
        </form.Field>
        <div className="mt-3 flex items-center gap-1.5">
          <form.Field name="date">
            {(field) => (
              <DatePicker
                aria-label={t("fields.date")}
                onBlur={field.handleBlur}
                onChange={field.handleChange}
                value={field.state.value}
                variant="chip"
              />
            )}
          </form.Field>
        </div>
      </FormSection>
      <FormSection>
        <FieldGroup>
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
