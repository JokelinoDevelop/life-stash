import { useTranslation } from "react-i18next";

import { DialogForm, FormSection } from "@/components/form/dialog-form";
import { useAppForm } from "@/components/form/form-hook";
import { FieldGroup, FieldLabel } from "@/components/ui/field";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useErrorMessage } from "@/lib/errors";
import { formFieldOfError } from "@/lib/server-errors";

import { ClientTermsSection } from "./client-form-sections";
import { CLIENT_SERVER_FIELDS } from "./mapper";
import { clientFormSchema } from "./schema";
import type { ClientFormValues } from "./schema";

/** New / edit client (3.6). A taken name comes back from the server onto the Name field. */
export const ClientForm = ({
  defaultValues,
  isNew,
  onCancel,
  onSubmit,
}: {
  defaultValues: ClientFormValues;
  isNew: boolean;
  onCancel: () => void;
  onSubmit: (values: ClientFormValues) => Promise<void>;
}) => {
  const { t } = useTranslation("finances");
  const errorMessage = useErrorMessage();

  const form = useAppForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      try {
        await onSubmit(value);
      } catch (error) {
        const field =
          error instanceof Error
            ? formFieldOfError(error, CLIENT_SERVER_FIELDS)
            : null;

        if (field !== null) {
          form.setFieldMeta(field, (meta) => ({
            ...meta,
            errorMap: { ...meta.errorMap, onSubmit: errorMessage(error) },
            isTouched: true,
          }));
        }
      }
    },
    validators: { onSubmit: clientFormSchema },
  });

  return (
    <DialogForm
      footer={
        <form.AppForm>
          <form.FormFooter
            onCancel={onCancel}
            submitLabel={isNew ? t("clients.form.create") : undefined}
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
              <field.TextField autoFocus label={t("clients.form.name")} />
            )}
          </form.AppField>
          <form.Field name="kind">
            {(field) => (
              <div className="flex flex-col gap-2">
                <FieldLabel>{t("clients.form.kind")}</FieldLabel>
                <ToggleGroup
                  aria-label={t("clients.form.kind")}
                  onValueChange={(value) => {
                    if (value === "client" || value === "employer") {
                      field.handleChange(value);
                    }
                  }}
                  size="segmented"
                  spacing={0.5}
                  type="single"
                  value={field.state.value}
                  variant="segmented"
                >
                  <ToggleGroupItem value="client">
                    {t("clients.form.kindClient")}
                  </ToggleGroupItem>
                  <ToggleGroupItem value="employer">
                    {t("clients.form.kindEmployer")}
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
            )}
          </form.Field>
        </FieldGroup>
      </FormSection>
      <ClientTermsSection form={form} />
    </DialogForm>
  );
};
