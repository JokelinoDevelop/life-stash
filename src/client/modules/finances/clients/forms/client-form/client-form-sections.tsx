import { INVOICE_LANGUAGES } from "@shared/domain/finances/invoice-document";
import { CURRENCIES } from "@shared/domain/money";
import { useTranslation } from "react-i18next";

import { FormSection } from "@/components/form/dialog-form";
import { withForm } from "@/components/form/form-hook";
import { FieldGroup } from "@/components/ui/field";

import { clientFormDefaults } from "./mapper";

const TEMPLATE = clientFormDefaults({
  currency: "EUR",
  language: "en",
  termsDays: 30,
});

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

/** What their invoices print under "Bill to", and in which language (clients only). */
export const ClientBillingSection = withForm({
  defaultValues: TEMPLATE,
  render: function ClientBillingSectionRender({ form }) {
    const { t } = useTranslation("finances");

    return (
      <form.Subscribe selector={(state) => state.values.kind}>
        {(kind) =>
          kind === "client" && (
            <FormSection
              description={t("clients.form.billingHint")}
              title={t("clients.form.billing")}
            >
              <FieldGroup>
                <form.AppField name="address">
                  {(field) => (
                    <field.TextareaField
                      label={t("clients.form.address")}
                      optional
                      placeholder={t("clients.form.addressPlaceholder")}
                    />
                  )}
                </form.AppField>
                <div className="grid gap-4 sm:grid-cols-2">
                  <form.AppField name="taxId">
                    {(field) => (
                      <field.TextField
                        label={t("clients.form.taxId")}
                        optional
                      />
                    )}
                  </form.AppField>
                  <form.AppField name="invoiceLanguage">
                    {(field) => (
                      <field.SelectField
                        label={t("clients.form.invoiceLanguage")}
                        options={INVOICE_LANGUAGES.map((language) => ({
                          label: t(`clients.languages.${language}`),
                          value: language,
                        }))}
                      />
                    )}
                  </form.AppField>
                </div>
              </FieldGroup>
            </FormSection>
          )
        }
      </form.Subscribe>
    );
  },
});
