import type { Currency } from "@shared/domain/money";
import type { InferRequestType } from "hono/client";
import { useTranslation } from "react-i18next";

import { api, unwrap } from "@/lib/api";
import { useAppMutation } from "@/lib/mutation";

import { financeKeys } from "../finance-keys";
import { useLedgerMoney } from "../money";

type CreateBody = InferRequestType<typeof api.finances.invoices.$post>["json"];

type UpdateBody = InferRequestType<
  (typeof api.finances.invoices)[":invoiceId"]["$patch"]
>["json"];

const invalidate = [financeKeys.all] as const;

const ISSUED_TOAST = "invoices.issuedToast";

const invoiceApi = (_invoiceId: string) => api.finances.invoices[":invoiceId"];

/** Saves a draft, or issues it straight away (`issue: true`); the toast names the number. */
export const useCreateInvoice = (onFieldError?: (error: Error) => boolean) => {
  const { t } = useTranslation("finances");

  return useAppMutation({
    invalidate,
    mutationFn: async (json: CreateBody) =>
      await unwrap(api.finances.invoices.$post({ json })),
    onError: onFieldError,
    success: false,
    successFor: (data) =>
      data.number === null
        ? t("invoices.draftSaved")
        : t(ISSUED_TOAST, { number: data.number }),
  });
};

/** Edits a draft (optionally issuing it) or an issued invoice's notes. */
export const useUpdateInvoice = (onFieldError?: (error: Error) => boolean) => {
  const { t } = useTranslation("finances");

  return useAppMutation({
    invalidate,
    mutationFn: async ({ id, json }: { id: string; json: UpdateBody }) =>
      await unwrap(invoiceApi(id).$patch({ json, param: { invoiceId: id } })),
    onError: onFieldError,
    success: false,
    successFor: (data, { json }) => {
      if (data.number !== null && json.issue === true) {
        return t(ISSUED_TOAST, { number: data.number });
      }

      return data.number === null
        ? t("invoices.draftUpdated")
        : t("invoices.updated", { number: data.number });
    },
  });
};

interface InvoiceRef {
  id: string;
  /** How the toast names it ("2026-012", or "Draft"). */
  label: string;
}

/** Gives a draft its number (`number` null takes the next one). */
export const useIssueInvoice = () => {
  const { t } = useTranslation("finances");

  return useAppMutation({
    invalidate,
    mutationFn: async ({ id, number }: { id: string; number: string | null }) =>
      await unwrap(
        invoiceApi(id).issue.$post({
          json: { number },
          param: { invoiceId: id },
        })
      ),
    success: false,
    successFor: (data) => t(ISSUED_TOAST, { number: data.number }),
  });
};

export const useVoidInvoice = () => {
  const { t } = useTranslation("finances");

  return useAppMutation({
    invalidate,
    mutationFn: async ({ id }: InvoiceRef) =>
      await unwrap(invoiceApi(id).void.$post({ param: { invoiceId: id } })),
    success: false,
    successFor: (_data, { label }) => t("invoices.voided", { number: label }),
  });
};

/** Deletes a draft; Undo restores it. */
export const useDeleteInvoice = () => {
  const { t } = useTranslation("finances");

  return useAppMutation({
    invalidate,
    mutationFn: async ({ id }: InvoiceRef) =>
      await unwrap(invoiceApi(id).$delete({ param: { invoiceId: id } })),
    success: t("invoices.draftDeleted"),
    undo: async (_data, { id }) =>
      await unwrap(invoiceApi(id).restore.$post({ param: { invoiceId: id } })),
  });
};

interface Payment extends InvoiceRef {
  paidDate: string;
  amountMinor: number;
  currency: Currency;
}

/** Marks paid; the toast offers "View" (the new ledger entry). */
export const useMarkPaid = (onView: () => void) => {
  const { t } = useTranslation("finances");
  const ledger = useLedgerMoney();
  const { t: tc } = useTranslation();

  // oxlint-disable-next-line sonarjs/shorthand-property-grouping -- conflicts with sort-keys
  return useAppMutation({
    action: () => ({ label: tc("actions.view"), onClick: onView }),
    invalidate,
    mutationFn: async ({ amountMinor, id, paidDate }: Payment) =>
      await unwrap(
        invoiceApi(id)["mark-paid"].$post({
          json: { amountMinor, paidDate },
          param: { invoiceId: id },
        })
      ),
    success: false,
    successFor: (_data, payment) =>
      t("invoices.paidToast", {
        amount: ledger.money(payment.amountMinor, payment.currency),
        number: payment.label,
      }),
  });
};

/** Marks unpaid (removing the ledger entry); Undo books the same payment again. */
export const useMarkUnpaid = () => {
  const { t } = useTranslation("finances");

  return useAppMutation({
    invalidate,
    mutationFn: async ({ id }: InvoiceRef) =>
      await unwrap(
        invoiceApi(id)["mark-unpaid"].$post({ param: { invoiceId: id } })
      ),
    success: false,
    successFor: (_data, { label }) =>
      t("invoices.unpaidToast", { number: label }),
    undo: async (payment, { id }) =>
      await unwrap(
        invoiceApi(id)["mark-paid"].$post({
          json: payment,
          param: { invoiceId: id },
        })
      ),
  });
};
