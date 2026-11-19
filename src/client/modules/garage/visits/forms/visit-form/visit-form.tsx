import { VISIT_KINDS } from "@shared/domain/garage-kinds";
import { CURRENCIES } from "@shared/domain/money";
import { useTranslation } from "react-i18next";

import { Panel } from "@/components/app/list-section";
import { FieldGroup } from "@/components/ui/field";
import { useFormat } from "@/lib/format";

import { ItemsEditor } from "./items-editor";
import type { VisitFormValues } from "./schema";
import { useVisitForm } from "./use-visit-form";

export const VisitForm = ({
  defaultValues,
  onSubmit,
  showPhotosHint,
}: {
  defaultValues: VisitFormValues;
  onSubmit: (values: VisitFormValues) => Promise<void>;
  showPhotosHint: boolean;
}) => {
  const { t } = useTranslation("garageVisits");
  const { t: tc } = useTranslation();
  const { unit } = useFormat();
  const form = useVisitForm(defaultValues, onSubmit);

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
    >
      <Panel>
        <FieldGroup>
          <form.AppField name="date">
            {(field) => <field.PartialDateField label={t("form.date")} />}
          </form.AppField>
          <div className="grid gap-4 sm:grid-cols-2">
            <form.AppField name="odometer">
              {(field) => (
                <field.TextField
                  inputMode="numeric"
                  label={t("form.odometer")}
                  optional
                  suffix={tc(`units.${unit}`)}
                />
              )}
            </form.AppField>
            <form.AppField name="kind">
              {(field) => (
                <field.SelectField
                  label={t("form.kind")}
                  options={VISIT_KINDS.map((kind) => ({
                    label: t(`kinds.${kind}`),
                    value: kind,
                  }))}
                />
              )}
            </form.AppField>
          </div>
          <form.AppField name="byPreviousOwner">
            {(field) => (
              <field.SwitchField
                description={t("form.byPreviousOwnerHelp")}
                label={t("form.byPreviousOwner")}
              />
            )}
          </form.AppField>
          <form.AppField name="shop">
            {(field) => <field.TextField label={t("form.shop")} optional />}
          </form.AppField>
        </FieldGroup>
      </Panel>
      <Panel>
        <ItemsEditor form={form} />
      </Panel>
      <Panel>
        <FieldGroup>
          <div className="grid grid-cols-[1fr_auto] gap-3">
            <form.AppField name="total">
              {(field) => (
                <field.TextField
                  description={t("form.totalHelp")}
                  inputMode="decimal"
                  label={t("form.total")}
                  optional
                />
              )}
            </form.AppField>
            <form.AppField name="currency">
              {(field) => (
                <field.SelectField
                  label={tc("fields.currency")}
                  options={CURRENCIES.map((code) => ({
                    label: code,
                    value: code,
                  }))}
                />
              )}
            </form.AppField>
          </div>
          <form.AppField name="notes">
            {(field) => (
              <field.TextareaField label={tc("fields.notes")} optional />
            )}
          </form.AppField>
          {showPhotosHint && (
            <p className="text-muted-foreground text-sm">
              {t("form.photosHint")}
            </p>
          )}
        </FieldGroup>
      </Panel>
      <form.AppForm>
        <form.SubmitButton className="self-end" />
      </form.AppForm>
    </form>
  );
};
