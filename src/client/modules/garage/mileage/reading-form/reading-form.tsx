import { useTranslation } from "react-i18next";

import { useAppForm } from "@/components/form/form-hook";
import { FieldGroup } from "@/components/ui/field";
import { useFormat } from "@/lib/format";

import { readingOdometerKm } from "./mapper";
import { readingFormSchema } from "./schema";
import type { ReadingFormValues } from "./schema";

export const ReadingForm = ({
  defaultValues,
  latestKm,
  onSubmit,
}: {
  defaultValues: ReadingFormValues;
  /** Highest known odometer value, used to warn about lower entries. */
  latestKm: number | null;
  onSubmit: (values: ReadingFormValues) => Promise<void>;
}) => {
  const { t } = useTranslation("garageMileage");
  const { t: tc } = useTranslation();
  const format = useFormat();

  const form = useAppForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      await onSubmit(value);
    },
    validators: { onSubmit: readingFormSchema },
  });

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
    >
      <FieldGroup>
        <form.AppField name="odometer">
          {(field) => (
            <field.TextField
              autoFocus
              inputMode="numeric"
              label={t("odometer")}
              suffix={tc(`units.${format.unit}`)}
            />
          )}
        </form.AppField>
        <form.Subscribe selector={(state) => state.values}>
          {(values) => {
            const km = readingOdometerKm(values, format.unit);

            return latestKm !== null && km !== null && km < latestKm ? (
              <output className="text-warning text-sm">
                {t("belowLatest", { distance: format.distance(latestKm) })}
              </output>
            ) : null;
          }}
        </form.Subscribe>
        <form.AppField name="date">
          {(field) => <field.TextField label={t("date")} type="date" />}
        </form.AppField>
        <form.AppField name="notes">
          {(field) => (
            <field.TextareaField label={tc("fields.notes")} optional />
          )}
        </form.AppField>
      </FieldGroup>
      <form.AppForm>
        <form.SubmitButton />
      </form.AppForm>
    </form>
  );
};
