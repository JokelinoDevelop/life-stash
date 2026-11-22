import { CURRENCIES } from "@shared/domain/money";
import { useTranslation } from "react-i18next";

import { FormSection } from "@/components/form/dialog-form";
import { withForm } from "@/components/form/form-hook";
import { FieldGroup } from "@/components/ui/field";

import { INVOICE_FORM_TEMPLATE } from "./mapper";

/** A recorded invoice (made elsewhere): its total as typed, in its currency. */
export const InvoiceRecordedSection = withForm({
  defaultValues: INVOICE_FORM_TEMPLATE,
  props: {},
  render: function InvoiceRecordedSectionRender({ form }) {
    const { t } = useTranslation("finances");

    return (
      <FormSection description={t("invoices.editor.recordedHint")}>
        <div className="grid grid-cols-[1fr_auto] gap-3">
          <form.AppField name="amount">
            {(field) => (
              <field.TextField
                inputMode="decimal"
                label={t("invoices.form.amount")}
              />
            )}
          </form.AppField>
          <form.AppField name="currency">
            {(field) => (
              <field.SelectField
                label={t("invoices.form.currency")}
                options={CURRENCIES.map((code) => ({
                  label: code,
                  value: code,
                }))}
              />
            )}
          </form.AppField>
        </div>
      </FormSection>
    );
  },
});

/**
 * The description (recorded: what it was for; itemised: a note printed under the lines) and
 * your private notes.
 */
export const InvoiceNotesSection = withForm({
  defaultValues: INVOICE_FORM_TEMPLATE,
  props: {},
  render: function InvoiceNotesSectionRender({ form }) {
    const { t } = useTranslation("finances");

    return (
      <FormSection>
        <FieldGroup>
          <form.Subscribe selector={(state) => state.values.mode}>
            {(mode) => (
              <form.AppField name="description">
                {(field) =>
                  mode === "itemised" ? (
                    <field.TextField
                      description={t("invoices.editor.noteHint")}
                      label={t("invoices.editor.note")}
                      optional
                      placeholder={t("invoices.editor.notePlaceholder")}
                    />
                  ) : (
                    <field.TextField
                      label={t("invoices.form.description")}
                      optional
                    />
                  )
                }
              </form.AppField>
            )}
          </form.Subscribe>
          <form.AppField name="notes">
            {(field) => (
              <field.TextareaField
                description={t("invoices.editor.privateNotesHint")}
                label={t("invoices.form.notes")}
                optional
                placeholder={t("invoices.form.notesPlaceholder")}
              />
            )}
          </form.AppField>
        </FieldGroup>
      </FormSection>
    );
  },
});
