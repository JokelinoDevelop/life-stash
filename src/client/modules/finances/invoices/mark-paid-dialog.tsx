import { addDays, daysBetween } from "@shared/domain/dates";
import { daysToGetPaid } from "@shared/domain/finances/invoices";
import { toMinor } from "@shared/domain/money";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { FormDialog } from "@/components/app/form-dialog";
import { ErrorState, FormSkeleton } from "@/components/app/states";
import { DatePicker } from "@/components/form/date-picker";
import { DialogForm, FormSection } from "@/components/form/dialog-form";
import { FieldErrors } from "@/components/form/field-errors";
import { useAppForm } from "@/components/form/form-hook";
import { Button } from "@/components/ui/button";
import { parseAmount } from "@/lib/form-schemas";
import { useFormat } from "@/lib/format";
import { todayIso } from "@/lib/partial-date";

import { useCategoryName } from "../categories/category-label";
import { useCurrencySymbol, useLedgerMoney } from "../money";
import {
  markPaidFormDefaults,
  markPaidFormToRequest,
} from "./forms/mark-paid-form/mapper";
import { markPaidFormSchema } from "./forms/mark-paid-form/schema";
import type { MarkPaidFormValues } from "./forms/mark-paid-form/schema";
import { useInvoiceFor } from "./invoice-labels";
import { useMarkPaid } from "./invoices.mutations";
import { invoiceQuery } from "./invoices.queries";
import type { InvoiceDetail } from "./invoices.queries";
import { useViewLedger } from "./use-invoice-actions";

type Close = () => Promise<void>;

/** "This adds to your ledger": the entry Mark paid books, and how late it was. */
const LedgerPreview = ({
  invoice,
  values,
}: {
  invoice: InvoiceDetail;
  values: MarkPaidFormValues;
}) => {
  const { t } = useTranslation("finances");
  const format = useFormat();
  const ledger = useLedgerMoney();
  const nameOf = useCategoryName();
  const days = daysToGetPaid(invoice.issueDate, values.paidDate);

  const late = Math.max(0, daysBetween(invoice.dueDate, values.paidDate));

  return (
    <FormSection title={t("invoices.markPaidDialog.adds")}>
      <dl className="grid grid-cols-[9rem_minmax(0,1fr)] gap-x-3 gap-y-1.5 text-sm">
        <dt className="text-muted-foreground">
          {t("invoices.markPaidDialog.income")}
        </dt>
        <dd className="text-success-foreground font-medium tabular-nums">
          {ledger.signed(
            toMinor(parseAmount(values.amount) ?? 0),
            invoice.currency,
            "income"
          )}
        </dd>
        <dt className="text-muted-foreground">
          {t("invoices.markPaidDialog.category")}
        </dt>
        <dd>{nameOf({ name: "", systemKey: "invoices" })}</dd>
        <dt className="text-muted-foreground">
          {t("invoices.markPaidDialog.date")}
        </dt>
        <dd className="tabular-nums">{format.date(values.paidDate)}</dd>
        <dt className="text-muted-foreground">
          {t("invoices.markPaidDialog.daysToPay")}
        </dt>
        <dd className="tabular-nums">
          {late > 0
            ? t("invoices.markPaidDialog.late", { days, late })
            : t("invoices.markPaidDialog.onTime", { days })}
        </dd>
      </dl>
    </FormSection>
  );
};

/** Paid today / Yesterday, or any date from the picker. */
const PaidDateChips = ({
  onChange,
  value,
}: {
  onChange: (date: string) => void;
  value: string;
}) => {
  const { t } = useTranslation("finances");
  const today = todayIso();
  const yesterday = addDays(today, -1);

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Button
        aria-pressed={value === today}
        onClick={() => {
          onChange(today);
        }}
        size="xs"
        type="button"
        variant="chip"
      >
        {t("invoices.markPaidDialog.today")}
      </Button>
      <Button
        aria-pressed={value === yesterday}
        onClick={() => {
          onChange(yesterday);
        }}
        size="xs"
        type="button"
        variant="chip"
      >
        {t("invoices.markPaidDialog.yesterday")}
      </Button>
      <DatePicker
        aria-label={t("invoices.markPaidDialog.date")}
        onChange={onChange}
        value={value}
        variant="chip"
      />
    </div>
  );
};

const MarkPaidForm = ({
  invoice,
  onClose,
}: {
  invoice: InvoiceDetail;
  onClose: Close;
}) => {
  const { t } = useTranslation("finances");
  const symbol = useCurrencySymbol()(invoice.currency);
  const forLabel = useInvoiceFor();
  const viewLedger = useViewLedger();
  const markPaid = useMarkPaid(viewLedger);
  const today = todayIso();

  const form = useAppForm({
    defaultValues: markPaidFormDefaults(invoice, today),
    onSubmit: async ({ value }) => {
      await markPaid.mutateAsync({
        ...markPaidFormToRequest(value),
        currency: invoice.currency,
        id: invoice.id,
        number: invoice.number,
      });
      await onClose();
    },
    validators: { onSubmit: markPaidFormSchema },
  });

  return (
    <DialogForm
      footer={
        <form.AppForm>
          <form.FormFooter
            onCancel={() => {
              void onClose();
            }}
            submitLabel={t("invoices.markPaidDialog.confirm")}
          />
        </form.AppForm>
      }
      onSubmit={() => {
        void form.handleSubmit();
      }}
    >
      <FormSection>
        <form.Field name="amount">
          {(field) => {
            const invalid =
              field.state.meta.isTouched && !field.state.meta.isValid;

            return (
              <div className="flex flex-col">
                <label
                  className="text-muted-foreground text-xs font-medium"
                  htmlFor="amount"
                >
                  {t("invoices.markPaidDialog.received")}
                </label>
                <div className="mt-0.5 flex items-baseline gap-1.5">
                  <span
                    aria-hidden="true"
                    className="text-muted-foreground text-3xl font-semibold"
                  >
                    {symbol}
                  </span>
                  <input
                    aria-invalid={invalid}
                    className="min-w-0 flex-1 border-0 bg-transparent p-0 text-3xl font-semibold tracking-tight tabular-nums outline-none"
                    id="amount"
                    inputMode="decimal"
                    onBlur={field.handleBlur}
                    onChange={(event) => {
                      field.handleChange(event.target.value);
                    }}
                    value={field.state.value}
                  />
                </div>
                <FieldErrors
                  errors={field.state.meta.errors.slice(0, 1)}
                  show={invalid}
                />
                <p className="text-muted-foreground mt-1 text-sm">
                  {invoice.clientName} · {forLabel(invoice)}
                </p>
              </div>
            );
          }}
        </form.Field>
        <form.Field name="paidDate">
          {(field) => (
            <PaidDateChips
              onChange={field.handleChange}
              value={field.state.value}
            />
          )}
        </form.Field>
      </FormSection>
      <form.Subscribe selector={(state) => state.values}>
        {(values) => <LedgerPreview invoice={invoice} values={values} />}
      </form.Subscribe>
    </DialogForm>
  );
};

/** `?dialog=mark-paid&id=…`: books the payment (3.5). */
export const MarkPaidDialog = ({
  invoiceId,
  onClose,
  onOpenChange,
  open,
}: {
  invoiceId: string;
  onClose: Close;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}) => {
  const { t } = useTranslation("finances");
  const detail = useQuery(invoiceQuery(invoiceId));

  let body = <FormSkeleton fields={3} />;

  if (detail.isError) {
    body = (
      <ErrorState
        className="m-4 md:m-4"
        error={detail.error}
        onRetry={() => {
          void detail.refetch();
        }}
      />
    );
  } else if (detail.data !== undefined) {
    body = <MarkPaidForm invoice={detail.data.invoice} onClose={onClose} />;
  }

  return (
    <FormDialog
      crumb={
        <span className="tabular-nums">
          {detail.data?.invoice.number ?? t("invoices.title")}
        </span>
      }
      onOpenChange={onOpenChange}
      open={open}
      title={t("invoices.markPaidDialog.title")}
    >
      {body}
    </FormDialog>
  );
};
