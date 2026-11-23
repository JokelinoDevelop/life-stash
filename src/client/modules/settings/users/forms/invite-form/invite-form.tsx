import { useTranslation } from "react-i18next";

import { DialogForm, FormSection } from "@/components/form/dialog-form";
import { useAppForm } from "@/components/form/form-hook";
import { FieldGroup } from "@/components/ui/field";

import { inviteFormSchema } from "./schema";
import type { InviteFormValues } from "./schema";

export const InviteForm = ({
  defaultValues,
  onCancel,
  onSubmit,
}: {
  defaultValues: InviteFormValues;
  onCancel: () => void;
  onSubmit: (values: InviteFormValues) => Promise<void>;
}) => {
  const { t } = useTranslation("settings");

  const form = useAppForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      await onSubmit(value);
    },
    validators: { onSubmit: inviteFormSchema },
  });

  return (
    <DialogForm
      footer={
        <form.AppForm>
          <form.FormFooter
            onCancel={onCancel}
            submitLabel={t("users.createLink")}
          />
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
                description={t("users.inviteNameHelp")}
                label={t("users.inviteName")}
                optional
              />
            )}
          </form.AppField>
          <form.AppField name="household">
            {(field) => (
              <field.SelectField
                description={t("users.householdHelp")}
                label={t("users.household")}
                options={[
                  { label: t("users.householdOwn"), value: "own" },
                  { label: t("users.householdMine"), value: "mine" },
                ]}
              />
            )}
          </form.AppField>
        </FieldGroup>
      </FormSection>
    </DialogForm>
  );
};
