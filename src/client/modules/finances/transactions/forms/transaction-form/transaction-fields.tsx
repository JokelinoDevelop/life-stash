import { useTranslation } from "react-i18next";

import { AmountInput } from "@/components/form/amount-input";
import { DatePicker } from "@/components/form/date-picker";
import { FieldErrors } from "@/components/form/field-errors";
import { withForm } from "@/components/form/form-hook";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { useCategoryName } from "../../../categories/category-label";
import { CategoryPicker } from "./category-picker";
import { ClientPicker } from "./client-picker";
import type { ClientOption } from "./client-picker";
import { frequentCategories, noOptions } from "./frequent-categories";
import { InvoiceHint } from "./invoice-hint";
import { TRANSACTION_FORM_TEMPLATE as TEMPLATE } from "./mapper";

/** Amount with its currency, bound to the form. */
export const AmountFields = withForm({
  defaultValues: TEMPLATE,
  props: { centered: false },
  render: function AmountFieldsRender({ centered, form }) {
    return (
      <form.Subscribe
        selector={(state) => ({
          currency: state.values.currency,
          income: state.values.kind === "income",
        })}
      >
        {({ currency, income }) => (
          <form.Field name="amount">
            {(field) => (
              <AmountInput
                amount={field.state.value}
                centered={centered}
                currency={currency}
                errors={field.state.meta.errors}
                income={income}
                invalid={
                  field.state.meta.isTouched && !field.state.meta.isValid
                }
                onAmountBlur={field.handleBlur}
                onAmountChange={field.handleChange}
                onCurrencyChange={(value) => {
                  form.setFieldValue("currency", value);
                }}
              />
            )}
          </form.Field>
        )}
      </form.Subscribe>
    );
  },
});

export const DescriptionField = withForm({
  defaultValues: TEMPLATE,
  props: { inline: false },
  render: function DescriptionFieldRender({ form, inline }) {
    const { t } = useTranslation("finances");

    return (
      <form.Field name="description">
        {(field) => {
          const invalid =
            field.state.meta.isTouched && !field.state.meta.isValid;

          return (
            <div
              className={cn(
                "flex flex-col",
                inline ? "min-w-0 flex-1" : "mt-3.5"
              )}
            >
              <label className="sr-only" htmlFor="description">
                {t("form.description")}
              </label>
              <input
                aria-invalid={invalid}
                autoComplete="off"
                className={cn(
                  "placeholder:text-muted-foreground w-full border-0 bg-transparent p-0 outline-none",
                  inline ? "text-right text-base" : "text-base font-medium"
                )}
                id="description"
                onBlur={field.handleBlur}
                onChange={(event) => {
                  field.handleChange(event.target.value);
                }}
                placeholder={t("form.descriptionPlaceholder")}
                value={field.state.value}
              />
              <FieldErrors errors={field.state.meta.errors} show={invalid} />
            </div>
          );
        }}
      </form.Field>
    );
  },
});

export const NoteField = withForm({
  defaultValues: TEMPLATE,
  render: function NoteFieldRender({ form }) {
    const { t } = useTranslation("finances");

    return (
      <form.Field name="notes">
        {(field) => (
          <>
            <label className="sr-only" htmlFor="notes">
              {t("form.note")}
            </label>
            <textarea
              className="placeholder:text-muted-foreground mt-1 h-11 w-full resize-none border-0 bg-transparent p-0 text-base outline-none md:text-sm"
              id="notes"
              onBlur={field.handleBlur}
              onChange={(event) => {
                field.handleChange(event.target.value);
              }}
              placeholder={t("form.notePlaceholder")}
              value={field.state.value}
            />
          </>
        )}
      </form.Field>
    );
  },
});

const NO_DATES: readonly string[] = [];

export const DateChip = withForm({
  defaultValues: TEMPLATE,
  props: { quickDates: NO_DATES },
  render: function DateChipRender({ form, quickDates }) {
    const { t } = useTranslation("finances");

    return (
      <form.Field name="date">
        {(field) => (
          <DatePicker
            aria-label={t("form.date")}
            onBlur={field.handleBlur}
            onChange={field.handleChange}
            quickDates={quickDates}
            value={field.state.value}
            variant="chip"
          />
        )}
      </form.Field>
    );
  },
});

/** Category chip bound to the form, with the kind's options. */
export const CategoryField = withForm({
  defaultValues: TEMPLATE,
  props: { optionsFor: noOptions },
  render: function CategoryFieldRender({ form, optionsFor }) {
    return (
      <form.Subscribe selector={(state) => state.values.kind}>
        {(kind) => (
          <form.Field name="categoryId">
            {(field) => (
              <CategoryPicker
                categories={optionsFor(kind, field.state.value)}
                invalid={
                  field.state.meta.isTouched && !field.state.meta.isValid
                }
                onBlur={field.handleBlur}
                onChange={field.handleChange}
                value={field.state.value}
              />
            )}
          </form.Field>
        )}
      </form.Subscribe>
    );
  },
});

/** Category shortcuts: desktop "Frequent" pills, phone chips with "More…". */
export const FrequentChips = withForm({
  defaultValues: TEMPLATE,
  props: {
    optionsFor: noOptions,
    withMore: false,
  },
  render: function FrequentChipsRender({ form, optionsFor, withMore }) {
    const nameOf = useCategoryName();

    return (
      <form.Subscribe
        selector={(state) => ({
          categoryId: state.values.categoryId,
          kind: state.values.kind,
        })}
      >
        {({ categoryId, kind }) => {
          const options = optionsFor(kind, categoryId);

          return (
            <div className="flex flex-wrap gap-1.5">
              {frequentCategories(options).map((category) => (
                <Button
                  aria-pressed={category.id === categoryId}
                  key={category.id}
                  onClick={() => {
                    form.setFieldValue("categoryId", category.id);
                  }}
                  size="xs"
                  type="button"
                  variant="chip"
                >
                  {nameOf(category)}
                </Button>
              ))}
              {withMore && (
                <form.Field name="categoryId">
                  {(field) => (
                    <CategoryPicker
                      categories={options}
                      invalid={false}
                      onBlur={field.handleBlur}
                      onChange={field.handleChange}
                      trigger="more"
                      value={field.state.value}
                    />
                  )}
                </form.Field>
              )}
            </div>
          );
        }}
      </form.Subscribe>
    );
  },
});

const NO_CLIENTS: readonly ClientOption[] = [];

/** Income only: who paid, plus the hint when that client has unpaid invoices. */
export const ClientField = withForm({
  defaultValues: TEMPLATE,
  props: { clients: NO_CLIENTS },
  render: function ClientFieldRender({ clients, form }) {
    return (
      <form.Subscribe selector={(state) => state.values.kind}>
        {(kind) =>
          kind === "income" && (
            <form.Field name="clientId">
              {(field) => (
                <ClientPicker
                  clients={clients}
                  onChange={field.handleChange}
                  value={field.state.value}
                />
              )}
            </form.Field>
          )
        }
      </form.Subscribe>
    );
  },
});

export const ClientHint = withForm({
  defaultValues: TEMPLATE,
  render: function ClientHintRender({ form }) {
    return (
      <form.Subscribe
        selector={(state) =>
          state.values.kind === "income" ? state.values.clientId : ""
        }
      >
        {(clientId) => <InvoiceHint clientId={clientId} />}
      </form.Subscribe>
    );
  },
});
