import { REMINDER_KINDS } from "@shared/domain/garage-kinds";
import { useTranslation } from "react-i18next";

import { DialogForm, FormSection } from "@/components/form/dialog-form";
import { useAppForm } from "@/components/form/form-hook";
import { FieldGroup } from "@/components/ui/field";
import { useFormat } from "@/lib/format";

import { reminderFormSchema } from "./schema";
import type { ReminderFormValues } from "./schema";

const useReminderForm = (
  defaultValues: ReminderFormValues,
  onSubmit: (values: ReminderFormValues) => Promise<void>
) =>
  useAppForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      await onSubmit(value);
    },
    validators: { onSubmit: reminderFormSchema },
  });

type ReminderFormApi = ReturnType<typeof useReminderForm>;

const DueCard = ({ form }: { form: ReminderFormApi }) => {
  const { t } = useTranslation("garageReminders");
  const { t: tc } = useTranslation();
  const { unit } = useFormat();

  return (
    <FormSection description={t("form.dueHelp")} title={t("form.due")}>
      <div className="grid gap-4 sm:grid-cols-2">
        <form.AppField name="dueDate">
          {(field) => <field.DateField label={t("form.dueDate")} optional />}
        </form.AppField>
        <form.AppField name="dueOdometer">
          {(field) => (
            <field.TextField
              inputMode="numeric"
              label={t("form.dueOdometer")}
              optional
              suffix={tc(`units.${unit}`)}
            />
          )}
        </form.AppField>
      </div>
    </FormSection>
  );
};

const RecurringCard = ({ form }: { form: ReminderFormApi }) => {
  const { t } = useTranslation("garageReminders");
  const { t: tc } = useTranslation();
  const { unit } = useFormat();

  return (
    <FormSection title={t("form.recurring")}>
      <FieldGroup>
        <div className="grid gap-4 sm:grid-cols-2">
          <form.AppField name="intervalMonths">
            {(field) => (
              <field.TextField
                inputMode="numeric"
                label={t("form.intervalMonths")}
                optional
              />
            )}
          </form.AppField>
          <form.AppField name="intervalKm">
            {(field) => (
              <field.TextField
                inputMode="numeric"
                label={t("form.intervalKm")}
                optional
                suffix={tc(`units.${unit}`)}
              />
            )}
          </form.AppField>
        </div>
        <form.AppField name="notes">
          {(field) => (
            <field.TextareaField label={tc("fields.notes")} optional />
          )}
        </form.AppField>
      </FieldGroup>
    </FormSection>
  );
};

export const ReminderForm = ({
  defaultValues,
  onCancel,
  onSubmit,
}: {
  defaultValues: ReminderFormValues;
  onCancel: () => void;
  onSubmit: (values: ReminderFormValues) => Promise<void>;
}) => {
  const { t } = useTranslation("garageReminders");
  const form = useReminderForm(defaultValues, onSubmit);

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
          <form.AppField name="kind">
            {(field) => (
              <field.SelectField
                label={t("form.kind")}
                options={REMINDER_KINDS.map((kind) => ({
                  label: t(`kinds.${kind}`),
                  value: kind,
                }))}
              />
            )}
          </form.AppField>
          <form.AppField name="title">
            {(field) => (
              <field.TextField
                label={t("form.title")}
                placeholder={t("form.titlePlaceholder")}
              />
            )}
          </form.AppField>
        </FieldGroup>
      </FormSection>
      <DueCard form={form} />
      <RecurringCard form={form} />
    </DialogForm>
  );
};
