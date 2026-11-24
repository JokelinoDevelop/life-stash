import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { DialogForm, FormSection } from "@/components/form/dialog-form";
import { useAppForm } from "@/components/form/form-hook";
import { FieldGroup, FieldLabel } from "@/components/ui/field";

import { LastNote } from "../../last-note";
import { SessionStatusToggle } from "../../session-status-toggle";
import { OTHER_TRAINING, sessionFormSchema } from "./schema";
import type { SessionFormValues } from "./schema";

interface TrainingOption {
  id: string;
  name: string;
  durationMinutes: number | null;
}

const trainingSelectOptions = (
  trainings: readonly TrainingOption[],
  otherLabel: string
) => [
  ...trainings.map((training) => ({
    label: training.name,
    value: training.id,
  })),
  { label: otherLabel, value: OTHER_TRAINING },
];

/** A weekly occurrence's training: shown, not picked. */
const LockedTraining = ({ name }: { name: string }) => {
  const { t } = useTranslation("fitness");

  return (
    <div className="flex flex-col gap-1">
      <FieldLabel>{t("sessions.form.training")}</FieldLabel>
      <p className="text-sm font-medium">{name}</p>
    </div>
  );
};

/** The training's usual length, as the duration placeholder. */
const usualMinutes = (
  trainings: readonly TrainingOption[],
  trainingId: string
): string | undefined => {
  const minutes = trainings.find(
    (training) => training.id === trainingId
  )?.durationMinutes;

  return minutes === null || minutes === undefined
    ? undefined
    : String(minutes);
};

/**
 * A session: which training (or a free-form name), when, how it went, and a note. Shows the
 * note from the last time the training was done.
 */
export const SessionForm = ({
  defaultValues,
  footerStart,
  lockedTraining,
  onCancel,
  onSubmit,
  trainings,
}: {
  defaultValues: SessionFormValues;
  footerStart?: ReactNode;
  /** A weekly occurrence: its training can't change (shown, not picked). */
  lockedTraining?: string;
  onCancel: () => void;
  onSubmit: (values: SessionFormValues) => Promise<void>;
  trainings: readonly TrainingOption[];
}) => {
  const { t } = useTranslation("fitness");

  const form = useAppForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      await onSubmit(value);
    },
    validators: { onSubmit: sessionFormSchema },
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
      <form.Subscribe
        selector={(state) => [state.values.trainingId, state.values.date]}
      >
        {([trainingId = "", date = ""]) =>
          trainingId === OTHER_TRAINING ? null : (
            <LastNote before={date} trainingId={trainingId} />
          )
        }
      </form.Subscribe>
      <FormSection>
        <FieldGroup>
          {lockedTraining === undefined ? (
            <>
              <form.AppField name="trainingId">
                {(field) => (
                  <field.SelectField
                    label={t("sessions.form.training")}
                    options={trainingSelectOptions(
                      trainings,
                      t("sessions.form.other")
                    )}
                  />
                )}
              </form.AppField>
              <form.Subscribe selector={(state) => state.values.trainingId}>
                {(trainingId) =>
                  trainingId === OTHER_TRAINING && (
                    <form.AppField name="title">
                      {(field) => (
                        <field.TextField
                          autoFocus
                          label={t("sessions.form.title")}
                          placeholder={t("sessions.form.titlePlaceholder")}
                        />
                      )}
                    </form.AppField>
                  )
                }
              </form.Subscribe>
            </>
          ) : (
            <LockedTraining name={lockedTraining} />
          )}
          <form.Field name="status">
            {(field) => (
              <SessionStatusToggle
                onChange={field.handleChange}
                value={field.state.value}
              />
            )}
          </form.Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <form.AppField name="date">
              {(field) => <field.DateField label={t("sessions.form.date")} />}
            </form.AppField>
            <form.Subscribe selector={(state) => state.values.trainingId}>
              {(trainingId) => (
                <form.AppField name="durationMinutes">
                  {(field) => (
                    <field.TextField
                      inputMode="numeric"
                      label={t("sessions.form.duration")}
                      optional
                      placeholder={usualMinutes(trainings, trainingId)}
                      suffix={t("minutesShort")}
                    />
                  )}
                </form.AppField>
              )}
            </form.Subscribe>
          </div>
          <form.AppField name="note">
            {(field) => (
              <field.TextareaField
                label={t("sessions.form.note")}
                optional
                placeholder={t("sessions.form.notePlaceholder")}
              />
            )}
          </form.AppField>
        </FieldGroup>
      </FormSection>
    </DialogForm>
  );
};
