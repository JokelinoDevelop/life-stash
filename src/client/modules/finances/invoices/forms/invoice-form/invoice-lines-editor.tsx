import { CURRENCIES } from "@shared/domain/money";
import { ChevronDown, ChevronUp, Plus, X } from "lucide-react";
import { useTranslation } from "react-i18next";

import { FormSection } from "@/components/form/dialog-form";
import { FieldErrors } from "@/components/form/field-errors";
import { withForm } from "@/components/form/form-hook";
import { Button } from "@/components/ui/button";
import { useFormat } from "@/lib/format";

import {
  INVOICE_FORM_TEMPLATE,
  formLineTotals,
  newInvoiceLine,
} from "./mapper";

const UNITS_LIST = "invoice-line-units";

const NO_UNITS: readonly string[] = [];

/** Move up / down and remove for one line. */
const LineActions = withForm({
  defaultValues: INVOICE_FORM_TEMPLATE,
  props: { count: 1, index: 0 },
  render: function LineActionsRender({ count, form, index }) {
    const { t } = useTranslation("finances");

    return (
      <form.Field mode="array" name="lines">
        {(field) => (
          <div className="flex items-center justify-end gap-0.5">
            <Button
              aria-label={t("invoices.editor.moveUp")}
              disabled={index === 0}
              onClick={() => {
                field.moveValue(index, index - 1);
              }}
              size="icon-compact"
              type="button"
              variant="ghost"
            >
              <ChevronUp />
            </Button>
            <Button
              aria-label={t("invoices.editor.moveDown")}
              disabled={index === count - 1}
              onClick={() => {
                field.moveValue(index, index + 1);
              }}
              size="icon-compact"
              type="button"
              variant="ghost"
            >
              <ChevronDown />
            </Button>
            <Button
              aria-label={t("invoices.editor.removeLine")}
              disabled={count === 1}
              onClick={() => {
                field.removeValue(index);
              }}
              size="icon-compact"
              type="button"
              variant="ghost"
            >
              <X />
            </Button>
          </div>
        )}
      </form.Field>
    );
  },
});

/** One line: description; quantity, unit, unit price, VAT (when registered) and its amount. */
const LineRow = withForm({
  defaultValues: INVOICE_FORM_TEMPLATE,
  props: { amount: "", count: 1, index: 0, vatRegistered: false },
  render: function LineRowRender({
    amount,
    count,
    form,
    index,
    vatRegistered,
  }) {
    const { t } = useTranslation("finances");

    return (
      <li className="flex flex-col gap-3 py-3 first:pt-0">
        <form.AppField name={`lines[${index}].description`}>
          {(field) => (
            <field.TextField label={t("invoices.editor.description")} />
          )}
        </form.AppField>
        <div
          className={
            vatRegistered
              ? "grid grid-cols-2 gap-3 sm:grid-cols-[5rem_5.5rem_minmax(0,1fr)_4.5rem]"
              : "grid grid-cols-2 gap-3 sm:grid-cols-[5rem_5.5rem_minmax(0,1fr)]"
          }
        >
          <form.AppField name={`lines[${index}].quantity`}>
            {(field) => (
              <field.TextField
                inputMode="decimal"
                label={t("invoices.editor.quantity")}
              />
            )}
          </form.AppField>
          <form.AppField name={`lines[${index}].unit`}>
            {(field) => (
              <field.TextField
                label={t("invoices.editor.unit")}
                list={UNITS_LIST}
                optional
              />
            )}
          </form.AppField>
          <form.AppField name={`lines[${index}].unitPrice`}>
            {(field) => (
              <field.TextField
                inputMode="decimal"
                label={t("invoices.editor.unitPrice")}
              />
            )}
          </form.AppField>
          {vatRegistered && (
            <form.AppField name={`lines[${index}].vatRate`}>
              {(field) => (
                <field.TextField
                  inputMode="decimal"
                  label={t("invoices.editor.vatRate")}
                  suffix="%"
                />
              )}
            </form.AppField>
          )}
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground text-sm tabular-nums">
            {t("invoices.editor.amount")} · {amount}
          </span>
          <LineActions count={count} form={form} index={index} />
        </div>
      </li>
    );
  },
});

/** Subtotal and VAT (when registered) and the total, as the invoice will show them. */
const LineTotals = withForm({
  defaultValues: INVOICE_FORM_TEMPLATE,
  props: { vatRegistered: false },
  render: function LineTotalsRender({ form, vatRegistered }) {
    const { t } = useTranslation("finances");
    const format = useFormat();

    return (
      <form.Subscribe
        selector={(state) => ({
          currency: state.values.currency,
          lines: state.values.lines,
        })}
      >
        {({ currency, lines }) => {
          const { totals } = formLineTotals(lines, vatRegistered);
          const money = (minor: number) => format.money(minor, currency);

          return (
            <dl className="ml-auto flex w-full max-w-xs flex-col gap-1 text-sm tabular-nums">
              {vatRegistered && (
                <>
                  <div className="text-muted-foreground flex justify-between">
                    <dt>{t("invoices.editor.subtotal")}</dt>
                    <dd>{money(totals.subtotalMinor)}</dd>
                  </div>
                  <div className="text-muted-foreground flex justify-between">
                    <dt>{t("invoices.editor.vat")}</dt>
                    <dd>{money(totals.vatMinor)}</dd>
                  </div>
                </>
              )}
              <div className="flex justify-between font-semibold">
                <dt>{t("invoices.editor.total")}</dt>
                <dd>{money(totals.totalMinor)}</dd>
              </div>
            </dl>
          );
        }}
      </form.Subscribe>
    );
  },
});

/** The lines of an itemised invoice: add, reorder, remove; totals and currency below. */
export const InvoiceLinesEditor = withForm({
  defaultValues: INVOICE_FORM_TEMPLATE,
  props: { defaultVatRateBp: 0, unitPicks: NO_UNITS, vatRegistered: false },
  render: function InvoiceLinesEditorRender({
    defaultVatRateBp,
    form,
    unitPicks,
    vatRegistered,
  }) {
    const { t } = useTranslation("finances");
    const format = useFormat();

    return (
      <FormSection title={t("invoices.editor.lines")}>
        <datalist id={UNITS_LIST}>
          {unitPicks.map((unit) => (
            <option key={unit} value={unit}>
              {unit}
            </option>
          ))}
        </datalist>
        <form.Field mode="array" name="lines">
          {(field) => {
            const priced = formLineTotals(field.state.value, vatRegistered);

            return (
              <div className="flex flex-col gap-2">
                <form.Subscribe selector={(state) => state.values.currency}>
                  {(currency) => (
                    <ol className="divide-divider flex flex-col divide-y">
                      {field.state.value.map((line, index) => (
                        <LineRow
                          amount={format.money(
                            priced.lines[index]?.amountMinor ?? 0,
                            currency
                          )}
                          count={field.state.value.length}
                          form={form}
                          index={index}
                          key={line.key}
                          vatRegistered={vatRegistered}
                        />
                      ))}
                    </ol>
                  )}
                </form.Subscribe>
                <FieldErrors
                  errors={field.state.meta.errors}
                  show={field.state.meta.errors.length > 0}
                />
                <Button
                  className="self-start"
                  onClick={() => {
                    field.pushValue(newInvoiceLine(defaultVatRateBp));
                  }}
                  size="compact"
                  type="button"
                  variant="outline"
                >
                  <Plus />
                  {t("invoices.editor.addLine")}
                </Button>
              </div>
            );
          }}
        </form.Field>
        <div className="flex items-end justify-between gap-4">
          <div className="w-28">
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
          <LineTotals form={form} vatRegistered={vatRegistered} />
        </div>
      </FormSection>
    );
  },
});
