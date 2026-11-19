import { CURRENCIES } from "@shared/domain/money";
import { useTranslation } from "react-i18next";

import { FormSection } from "@/components/form/dialog-form";
import { withForm } from "@/components/form/form-hook";
import { FieldGroup } from "@/components/ui/field";

import { clientFormDefaults } from "./mapper";

const TEMPLATE = clientFormDefaults({ currency: "EUR", termsDays: 30 });

/** Currency, payment terms, billing email and notes. */
export const ClientTermsSection = withForm({
  defaultValues: TEMPLATE,
  render: function ClientTermsSectionRender({ form }) {
    const { t } = useTranslation("finances");

    return (
      <FormSection>
        <FieldGroup>
          <div className="grid gap-4 sm:grid-cols-2">
            <form.AppField name="currency">
              {(field) => (
                <field.SelectField
                  label={t("clients.form.currency")}
                  options={CURRENCIES.map((code) => ({
                    label: code,
                    value: code,
                  }))}
                />
              )}
            </form.AppField>
            <form.AppField name="paymentTermsDays">
              {(field) => (
                <field.TextField
                  inputMode="numeric"
                  label={t("clients.form.terms")}
                  suffix={t("clients.form.days")}
                />
              )}
            </form.AppField>
          </div>
          <form.AppField name="email">
            {(field) => (
              <field.TextField
                autoComplete="email"
                inputMode="email"
                label={t("clients.form.email")}
                optional
                placeholder={t("clients.form.emailPlaceholder")}
              />
            )}
          </form.AppField>
          <form.AppField name="notes">
            {(field) => (
              <field.TextareaField
                label={t("clients.form.notes")}
                optional
                placeholder={t("clients.form.notesPlaceholder")}
              />
            )}
          </form.AppField>
        </FieldGroup>
      </FormSection>
    );
  },
});
