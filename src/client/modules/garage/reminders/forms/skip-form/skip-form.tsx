import { useTranslation } from "react-i18next";

import { useAppForm } from "@/components/form/form-hook";
import { FieldGroup } from "@/components/ui/field";
import { useFormat } from "@/lib/format";

import { skipFormSchema } from "./schema";
import type { SkipFormValues } from "./schema";

export const SkipForm = ({
  defaultValues,
  onSubmit,
}: {
  defaultValues: SkipFormValues;
  onSubmit: (values: SkipFormValues) => Promise<void>;
}) => {
  const { t } = useTranslation("garageReminders");
  const { t: tc } = useTranslation();
  const { unit } = useFormat();

  const form = useAppForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      await onSubmit(value);
    },
    validators: { onSubmit: skipFormSchema },
  });

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
    >
      <FieldGroup>
        <form.AppField name="date">
          {(field) => <field.DateField label={t("skip.date")} />}
        </form.AppField>
        <form.AppField name="odometer">
          {(field) => (
            <field.TextField
              inputMode="numeric"
              label={t("skip.odometer")}
              optional
              suffix={tc(`units.${unit}`)}
            />
          )}
        </form.AppField>
      </FieldGroup>
      <form.AppForm>
        <form.SubmitButton className="self-end" label={tc("actions.confirm")} />
      </form.AppForm>
    </form>
  );
};
