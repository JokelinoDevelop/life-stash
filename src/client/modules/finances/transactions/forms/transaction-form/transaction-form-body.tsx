import { addDays } from "@shared/domain/dates";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { FieldErrors } from "@/components/form/field-errors";
import { withForm } from "@/components/form/form-hook";
import { Button } from "@/components/ui/button";
import { todayIso } from "@/lib/partial-date";

import type { ClientOption } from "./client-picker";
import { noOptions } from "./frequent-categories";
import { TRANSACTION_FORM_TEMPLATE as TEMPLATE } from "./mapper";
import {
  AmountFields,
  CategoryField,
  ClientField,
  ClientHint,
  DateChip,
  DescriptionField,
  FrequentChips,
  NoteField,
} from "./transaction-fields";

const NO_CLIENTS: readonly ClientOption[] = [];

const noReceipt = (): ReactNode => null;

/** Desktop dialog body (3.1 / 3.2). */
export const DesktopBody = withForm({
  defaultValues: TEMPLATE,
  props: { clients: NO_CLIENTS, optionsFor: noOptions, receipt: noReceipt() },
  render: function DesktopBodyRender({ clients, form, optionsFor, receipt }) {
    const { t } = useTranslation("finances");

    return (
      <>
        <div className="mt-4">
          <AmountFields centered={false} form={form} />
        </div>
        <DescriptionField form={form} inline={false} />
        <NoteField form={form} />
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <CategoryField form={form} optionsFor={optionsFor} />
          <ClientField clients={clients} form={form} />
          <DateChip form={form} />
          {receipt}
        </div>
        <form.Field name="categoryId">
          {(field) => (
            <FieldErrors
              errors={field.state.meta.errors}
              show={field.state.meta.isTouched && !field.state.meta.isValid}
            />
          )}
        </form.Field>
        <ClientHint form={form} />
        <div className="border-divider mt-4 border-t pt-3">
          <p className="text-muted-foreground mb-2 text-xs font-medium">
            {t("form.frequent")}
          </p>
          <FrequentChips form={form} optionsFor={optionsFor} withMore={false} />
        </div>
      </>
    );
  },
});

/** Phone sheet body (5.4): centred amount, category chips, For / Date rows. */
export const MobileBody = withForm({
  defaultValues: TEMPLATE,
  props: { clients: NO_CLIENTS, optionsFor: noOptions, receipt: noReceipt() },
  render: function MobileBodyRender({ clients, form, optionsFor, receipt }) {
    const { t } = useTranslation("finances");
    const { t: tc } = useTranslation();
    const today = todayIso();

    return (
      <>
        <div className="py-6">
          <AmountFields centered form={form} />
        </div>
        <p className="text-muted-foreground mb-2 text-xs font-medium">
          {t("form.category")}
        </p>
        <FrequentChips form={form} optionsFor={optionsFor} withMore />
        <form.Field name="categoryId">
          {(field) => (
            <FieldErrors
              errors={field.state.meta.errors}
              show={field.state.meta.isTouched && !field.state.meta.isValid}
            />
          )}
        </form.Field>
        <div className="divide-divider mt-4 flex flex-col divide-y rounded-lg border">
          <div className="flex min-h-12 items-center gap-3 px-3.5">
            <span className="text-muted-foreground w-14 shrink-0 text-sm">
              {t("form.for")}
            </span>
            <DescriptionField form={form} inline />
          </div>
          <div className="flex min-h-12 items-center gap-3 px-3.5">
            <span className="text-muted-foreground w-14 shrink-0 text-sm">
              {t("form.date")}
            </span>
            <span className="ml-auto flex items-center gap-1.5">
              <DateChip form={form} />
              <form.Field name="date">
                {(field) =>
                  field.state.value === addDays(today, -1) ? null : (
                    <Button
                      onClick={() => {
                        field.handleChange(addDays(today, -1));
                      }}
                      size="xs"
                      type="button"
                      variant="outline"
                    >
                      {tc("date.yesterday")}
                    </Button>
                  )
                }
              </form.Field>
            </span>
          </div>
        </div>
        <form.Subscribe selector={(state) => state.values.kind}>
          {(kind) =>
            kind === "income" && (
              <div className="mt-2 flex min-h-12 items-center gap-3 rounded-lg border px-3.5">
                <span className="text-muted-foreground w-14 shrink-0 text-sm">
                  {t("form2.client")}
                </span>
                <span className="ml-auto">
                  <ClientField clients={clients} form={form} />
                </span>
              </div>
            )
          }
        </form.Subscribe>
        {receipt !== null && (
          <div className="mt-2 flex min-h-12 items-center gap-3 rounded-lg border px-3.5">
            <span className="text-muted-foreground w-14 shrink-0 text-sm">
              {t("receipts.title")}
            </span>
            <span className="ml-auto flex items-center gap-1">{receipt}</span>
          </div>
        )}
        <ClientHint form={form} />
        <div className="mt-3">
          <NoteField form={form} />
        </div>
      </>
    );
  },
});
