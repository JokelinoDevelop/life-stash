import { useTranslation } from "react-i18next";

import { DialogForm, FormSection } from "@/components/form/dialog-form";
import { useAppForm } from "@/components/form/form-hook";
import { FieldGroup } from "@/components/ui/field";

import { projectFormSchema } from "./schema";
import type { ProjectFormValues } from "./schema";

export const ProjectForm = ({
  defaultValues,
  onCancel,
  onSubmit,
}: {
  defaultValues: ProjectFormValues;
  onCancel: () => void;
  onSubmit: (values: ProjectFormValues) => Promise<void>;
}) => {
  const { t } = useTranslation("finances");

  const form = useAppForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      await onSubmit(value);
    },
    validators: { onSubmit: projectFormSchema },
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
          <form.AppField name="name">
            {(field) => (
              <field.TextField autoFocus label={t("projects.form.name")} />
            )}
          </form.AppField>
          <form.AppField name="notes">
            {(field) => (
              <field.TextareaField label={t("projects.form.notes")} optional />
            )}
          </form.AppField>
        </FieldGroup>
      </FormSection>
    </DialogForm>
  );
};
