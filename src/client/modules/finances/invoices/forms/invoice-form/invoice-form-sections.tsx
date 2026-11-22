import { addMonths } from "@shared/domain/dates";
import { defaultDueDate } from "@shared/domain/finances/invoices";
import { useTranslation } from "react-i18next";

import { FormSection } from "@/components/form/dialog-form";
import { withForm } from "@/components/form/form-hook";
import { FieldGroup } from "@/components/ui/field";

import { useMonthLabel } from "../../../transactions/month-band";
import { INVOICE_FORM_TEMPLATE, NO_PERIOD } from "./mapper";
import type { InvoiceClientOption, InvoiceProjectOption } from "./mapper";

const PERIOD_MONTHS_BACK = 12;
const PERIOD_MONTHS_AHEAD = 2;

/** Months offered for the work period, newest first, around the issue date. */
const periodOptions = (issueDate: string, current: string): string[] => {
  const base = `${issueDate.slice(0, 7)}-01`;

  const months = Array.from(
    { length: PERIOD_MONTHS_BACK + PERIOD_MONTHS_AHEAD + 1 },
    (_, index) => addMonths(base, PERIOD_MONTHS_AHEAD - index).slice(0, 7)
  );

  return current === NO_PERIOD || months.includes(current)
    ? months
    : [current, ...months];
};

const NO_CLIENTS: readonly InvoiceClientOption[] = [];

const noNumber = (): string | null => null;

const NO_PROJECTS: readonly InvoiceProjectOption[] = [];

const defaultTerms = (_clientId: string): number => 30;

/** The client's purchase order number, printed on the invoice. */
const InvoicePurchaseOrderField = withForm({
  defaultValues: INVOICE_FORM_TEMPLATE,
  render: function InvoicePurchaseOrderFieldRender({ form }) {
    const { t } = useTranslation("finances");

    return (
      <form.AppField name="purchaseOrder">
        {(field) => (
          <field.TextField label={t("invoices.form.purchaseOrder")} optional />
        )}
      </form.AppField>
    );
  },
});

export const InvoiceClientSection = withForm({
  defaultValues: INVOICE_FORM_TEMPLATE,
  props: {
    clients: NO_CLIENTS,
    nextNumber: noNumber(),
    previousNumber: noNumber(),
    projects: NO_PROJECTS,
  },
  render: function InvoiceClientSectionRender({
    clients,
    form,
    nextNumber,
    previousNumber,
    projects,
  }) {
    const { t } = useTranslation("finances");
    const month = useMonthLabel();

    return (
      <FormSection>
        <FieldGroup>
          <form.AppField
            listeners={{
              onChange: ({ value }) => {
                const client = clients.find((row) => row.id === value);

                const project = form.getFieldValue("projectId");

                if (
                  !projects.some(
                    (row) => row.id === project && row.clientId === value
                  )
                ) {
                  form.setFieldValue("projectId", NO_PERIOD);
                }

                if (client !== undefined) {
                  form.setFieldValue("currency", client.currency);
                  form.setFieldValue(
                    "dueDate",
                    defaultDueDate(
                      form.getFieldValue("issueDate"),
                      client.paymentTermsDays
                    )
                  );
                }
              },
            }}
            name="clientId"
          >
            {(field) => {
              const client = clients.find(
                (row) => row.id === field.state.value
              );

              return (
                <field.SelectField
                  description={
                    client === undefined
                      ? undefined
                      : [
                          t("invoices.form.clientHint", {
                            currency: client.currency,
                            days: client.paymentTermsDays,
                          }),
                          t(
                            `invoices.editor.writtenIn.${client.invoiceLanguage}`
                          ),
                        ].join(" · ")
                  }
                  label={t("invoices.form.client")}
                  options={clients.map((row) => ({
                    label: row.name,
                    value: row.id,
                  }))}
                  placeholder={t("invoices.form.pickClient")}
                />
              );
            }}
          </form.AppField>
          <div className="grid gap-4 sm:grid-cols-2">
            <form.AppField name="number">
              {(field) => (
                <field.TextField
                  description={
                    previousNumber === null
                      ? t("invoices.form.numberHintFirst")
                      : t("invoices.form.numberHint", {
                          number: previousNumber,
                        })
                  }
                  label={t("invoices.form.number")}
                  optional
                  placeholder={nextNumber ?? undefined}
                />
              )}
            </form.AppField>
            <form.Subscribe selector={(state) => state.values.issueDate}>
              {(issueDate) => (
                <form.AppField name="period">
                  {(field) => (
                    <field.SelectField
                      label={t("invoices.form.period")}
                      options={[
                        {
                          label: t("invoices.form.noPeriod"),
                          value: NO_PERIOD,
                        },
                        ...periodOptions(issueDate, field.state.value).map(
                          (value) => ({
                            label: month(value),
                            value,
                          })
                        ),
                      ]}
                    />
                  )}
                </form.AppField>
              )}
            </form.Subscribe>
          </div>
          <InvoicePurchaseOrderField form={form} />
          <InvoiceProjectField form={form} projects={projects} />
        </FieldGroup>
      </FormSection>
    );
  },
});

export const InvoiceDatesSection = withForm({
  defaultValues: INVOICE_FORM_TEMPLATE,
  props: { termsOf: defaultTerms },
  render: function InvoiceDatesSectionRender({ form, termsOf }) {
    const { t } = useTranslation("finances");

    return (
      <FormSection>
        <div className="grid gap-4 sm:grid-cols-2">
          <form.AppField
            listeners={{
              onChange: ({ value }) => {
                form.setFieldValue(
                  "dueDate",
                  defaultDueDate(value, termsOf(form.getFieldValue("clientId")))
                );
              },
            }}
            name="issueDate"
          >
            {(field) => (
              <field.DateField label={t("invoices.form.issueDate")} />
            )}
          </form.AppField>
          <form.Subscribe selector={(state) => state.values.clientId}>
            {(clientId) => (
              <form.AppField name="dueDate">
                {(field) => (
                  <field.DateField
                    description={t("invoices.form.dueHint", {
                      days: termsOf(clientId),
                    })}
                    label={t("invoices.form.dueDate")}
                  />
                )}
              </form.AppField>
            )}
          </form.Subscribe>
        </div>
      </FormSection>
    );
  },
});

/** The client's active projects (shown only when it has some). */
export const InvoiceProjectField = withForm({
  defaultValues: INVOICE_FORM_TEMPLATE,
  props: { projects: NO_PROJECTS },
  render: function InvoiceProjectFieldRender({ form, projects }) {
    const { t } = useTranslation("finances");

    return (
      <form.Subscribe selector={(state) => state.values.clientId}>
        {(clientId) => {
          const own = projects.filter(
            (project) =>
              project.clientId === clientId && project.status === "active"
          );

          return (
            own.length > 0 && (
              <form.AppField name="projectId">
                {(field) => (
                  <field.SelectField
                    label={t("projects.field")}
                    optional
                    options={[
                      { label: t("projects.none"), value: NO_PERIOD },
                      ...own.map((project) => ({
                        label: project.name,
                        value: project.id,
                      })),
                    ]}
                  />
                )}
              </form.AppField>
            )
          );
        }}
      </form.Subscribe>
    );
  },
});
