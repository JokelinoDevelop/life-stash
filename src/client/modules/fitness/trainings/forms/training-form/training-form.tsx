import { WEEKDAYS } from "@shared/domain/fitness/schedule";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { DialogForm, FormSection } from "@/components/form/dialog-form";
import { useAppForm } from "@/components/form/form-hook";
import {
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

import { useWeekdayNames } from "../../../use-weekday-names";
import { trainingFormSchema } from "./schema";
import type { TrainingFormValues } from "./schema";

/** A training: name, what it is, how long, and which weekdays it repeats on. */
export const TrainingForm = ({
  defaultValues,
  footerStart,
  onCancel,
  onSubmit,
}: {
  defaultValues: TrainingFormValues;
  footerStart?: ReactNode;
  onCancel: () => void;
  onSubmit: (values: TrainingFormValues) => Promise<void>;
}) => {
  const { t } = useTranslation("fitness");
  const weekdays = useWeekdayNames();

  const form = useAppForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      await onSubmit(value);
    },
    validators: { onSubmit: trainingFormSchema },
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
          <form.AppField name="name">
            {(field) => (
              <field.TextField
                autoFocus
                label={t("trainings.form.name")}
                placeholder={t("trainings.form.namePlaceholder")}
              />
            )}
          </form.AppField>
          <form.Field name="weekdays">
            {(field) => (
              <div className="flex flex-col gap-2">
                <FieldLabel>{t("trainings.form.repeat")}</FieldLabel>
                <ToggleGroup
                  aria-label={t("trainings.form.repeat")}
                  className="flex-wrap"
                  multiple
                  onValueChange={(value) => {
                    field.handleChange(value);
                  }}
                  spacing={1.5}
                  value={field.state.value}
                  variant="outline"
                >
                  {WEEKDAYS.map((day) => (
                    <ToggleGroupItem key={day} value={String(day)}>
                      {weekdays.short(day)}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
                <FieldDescription>
                  {field.state.value.length === 0
                    ? t("trainings.form.repeatNone")
                    : t("trainings.form.repeatHint")}
                </FieldDescription>
              </div>
            )}
          </form.Field>
          <form.AppField name="durationMinutes">
            {(field) => (
              <field.TextField
                inputMode="numeric"
                label={t("trainings.form.duration")}
                optional
                suffix={t("minutesShort")}
              />
            )}
          </form.AppField>
          <form.AppField name="description">
            {(field) => (
              <field.TextareaField
                label={t("trainings.form.description")}
                optional
                placeholder={t("trainings.form.descriptionPlaceholder")}
              />
            )}
          </form.AppField>
        </FieldGroup>
      </FormSection>
    </DialogForm>
  );
};
