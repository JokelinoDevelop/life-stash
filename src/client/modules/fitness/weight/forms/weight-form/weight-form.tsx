import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { DialogForm, FormSection } from "@/components/form/dialog-form";
import { useAppForm } from "@/components/form/form-hook";
import { FieldGroup } from "@/components/ui/field";

import { weightFormSchema } from "./schema";
import type { WeightFormValues } from "./schema";

/** Body weight for one day (kg). Saving a day that has an entry replaces it. */
export const WeightForm = ({
  defaultValues,
  footerStart,
  onCancel,
  onSubmit,
}: {
  defaultValues: WeightFormValues;
  footerStart?: ReactNode;
  onCancel: () => void;
  onSubmit: (values: WeightFormValues) => Promise<void>;
}) => {
  const { t } = useTranslation("fitness");

  const form = useAppForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      await onSubmit(value);
    },
    validators: { onSubmit: weightFormSchema },
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
      <FormSection>
        <FieldGroup>
          <div className="grid gap-4 sm:grid-cols-2">
            <form.AppField name="kg">
              {(field) => (
                <field.TextField
                  autoFocus
                  inputMode="decimal"
                  label={t("weight.form.weight")}
                  suffix={t("kg")}
                />
              )}
            </form.AppField>
            <form.AppField name="date">
              {(field) => (
                <field.DateField
                  description={t("weight.form.dateHint")}
                  label={t("weight.form.date")}
                />
              )}
            </form.AppField>
          </div>
          <form.AppField name="note">
            {(field) => (
              <field.TextField label={t("weight.form.note")} optional />
            )}
          </form.AppField>
        </FieldGroup>
      </FormSection>
    </DialogForm>
  );
};
