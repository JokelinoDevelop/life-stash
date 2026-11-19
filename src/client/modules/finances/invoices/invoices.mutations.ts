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

const invoiceApi = (_invoiceId: string) => api.finances.invoices[":invoiceId"];

export const useCreateInvoice = (onFieldError?: (error: Error) => boolean) => {
  const { t } = useTranslation("finances");

  return useAppMutation({
    invalidate,
    mutationFn: async (json: CreateBody) =>
      await unwrap(api.finances.invoices.$post({ json })),
    onError: onFieldError,
    success: false,
    successFor: (_data, json) =>
      json.markSent
        ? t("invoices.createdSent", { number: json.number })
        : t("invoices.created", { number: json.number }),
  });
};

export const useUpdateInvoice = (onFieldError?: (error: Error) => boolean) => {
  const { t } = useTranslation("finances");

  return useAppMutation({
    invalidate,
    mutationFn: async ({
      id,
      json,
    }: {
      id: string;
      json: UpdateBody;
      number: string;
    }) =>
      await unwrap(invoiceApi(id).$patch({ json, param: { invoiceId: id } })),
    onError: onFieldError,
    success: false,
    successFor: (_data, { number }) => t("invoices.updated", { number }),
  });
};

interface InvoiceRef {
  id: string;
  number: string;
}

export const useMarkSent = () => {
  const { t } = useTranslation("finances");

  return useAppMutation({
    invalidate,
    mutationFn: async ({ id }: InvoiceRef) =>
      await unwrap(
        invoiceApi(id)["mark-sent"].$post({ param: { invoiceId: id } })
      ),
    success: false,
    successFor: (_data, { number }) => t("invoices.sent", { number }),
  });
};

export const useVoidInvoice = () => {
  const { t } = useTranslation("finances");

  return useAppMutation({
    invalidate,
    mutationFn: async ({ id }: InvoiceRef) =>
      await unwrap(invoiceApi(id).void.$post({ param: { invoiceId: id } })),
    success: false,
    successFor: (_data, { number }) => t("invoices.voided", { number }),
  });
};

export const useDeleteInvoice = () => {
  const { t } = useTranslation("finances");

  return useAppMutation({
    invalidate,
    mutationFn: async ({ id }: InvoiceRef) =>
      await unwrap(invoiceApi(id).$delete({ param: { invoiceId: id } })),
    success: false,
    successFor: (_data, { number }) => t("invoices.deleted", { number }),
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
        number: payment.number,
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
    successFor: (_data, { number }) => t("invoices.unpaidToast", { number }),
    undo: async (payment, { id }) =>
      await unwrap(
        invoiceApi(id)["mark-paid"].$post({
          json: payment,
          param: { invoiceId: id },
        })
      ),
  });
};
