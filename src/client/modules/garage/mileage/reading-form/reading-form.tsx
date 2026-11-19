import { useTranslation } from "react-i18next";

import { DatePicker } from "@/components/form/date-picker";
import { DialogForm } from "@/components/form/dialog-form";
import { FieldErrors } from "@/components/form/field-errors";
import { useAppForm } from "@/components/form/form-hook";
import { useFormat } from "@/lib/format";

import { readingOdometerKm } from "./mapper";
import { readingFormSchema } from "./schema";
import type { ReadingFormValues } from "./schema";

interface LatestReading {
  km: number;
  date: string;
}

const Delta = ({
  latest,
  values,
}: {
  latest: LatestReading | null;
  values: ReadingFormValues;
}) => {
  const { t } = useTranslation("garageMileage");
  const format = useFormat();
  const km = readingOdometerKm(values, format.unit);

  if (latest === null || km === null) {
    return null;
  }

  if (km < latest.km) {
    return (
      <output className="text-warning-foreground text-sm">
        {t("belowLatest", { distance: format.distance(latest.km) })}
      </output>
    );
  }

  return (
    <output className="text-muted-foreground text-sm tabular-nums">
      <span className="text-success font-medium">
        +{format.distance(km - latest.km)}
      </span>{" "}
      {t("inline.sinceLast", {
        date: format.date(latest.date),
        distance: format.distance(latest.km),
      })}
    </output>
  );
};

/**
 * Odometer reading in the artifact's dialog layout: a large borderless
 * number, a note and a date chip, then Cancel / Save (⌘↵).
 */
export const ReadingForm = ({
  defaultValues,
  latest,
  onCancel,
  onSubmit,
}: {
  defaultValues: ReadingFormValues;
  /** Latest known reading, for "+420 km since …" and the lower-value warning. */
  latest: LatestReading | null;
  onCancel: () => void;
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
      <div className="flex flex-col px-4 pt-1 pb-4">
        <form.AppField name="odometer">
          {(field) => (
            <div className="flex flex-col">
              <label
                className="text-muted-foreground text-xs font-medium"
                htmlFor="reading-odometer"
              >
                {t("odometer")}
              </label>
              <div className="mt-0.5 flex items-baseline gap-1.5">
                <input
                  aria-invalid={
                    field.state.meta.isTouched && !field.state.meta.isValid
                  }
                  autoComplete="off"
                  // The dialog opens to log a number; focus it right away.
                  // oxlint-disable-next-line jsx-a11y/no-autofocus
                  autoFocus
                  className="placeholder:text-muted-foreground/50 w-0 min-w-0 flex-1 bg-transparent text-3xl font-semibold tracking-tight tabular-nums outline-none"
                  id="reading-odometer"
                  inputMode="numeric"
                  name={field.name}
                  onBlur={field.handleBlur}
                  onChange={(event) => {
                    field.handleChange(event.target.value);
                  }}
                  placeholder={latest === null ? "0" : format.number(latest.km)}
                  value={field.state.value}
                />
                <span className="text-muted-foreground text-base font-medium">
                  {tc(`units.${format.unit}`)}
                </span>
              </div>
              <FieldErrors
                errors={field.state.meta.errors}
                show={field.state.meta.isTouched}
              />
            </div>
          )}
        </form.AppField>
        <form.Subscribe selector={(state) => state.values}>
          {(values) => <Delta latest={latest} values={values} />}
        </form.Subscribe>
        <form.AppField name="notes">
          {(field) => (
            <>
              <label className="sr-only" htmlFor="reading-notes">
                {tc("fields.notes")}
              </label>
              <textarea
                className="placeholder:text-muted-foreground mt-4 h-16 resize-none bg-transparent text-base outline-none md:text-sm"
                id="reading-notes"
                name={field.name}
                onBlur={field.handleBlur}
                onChange={(event) => {
                  field.handleChange(event.target.value);
                }}
                placeholder={t("inline.addNote")}
                value={field.state.value}
              />
            </>
          )}
        </form.AppField>
        <form.AppField name="date">
          {(field) => (
            <div className="mt-1">
              <DatePicker
                aria-label={t("date")}
                onBlur={field.handleBlur}
                onChange={(value) => {
                  field.handleChange(value);
                }}
                value={field.state.value}
                variant="chip"
              />
            </div>
          )}
        </form.AppField>
      </div>
    </DialogForm>
  );
};
