import { formatShortDate } from "@shared/domain/dates";
import type { InvoiceStatus } from "@shared/domain/finances/invoices";
import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { useConfirm } from "@/components/app/confirm/confirm-context";

import { useLedgerMoney } from "../money";
import {
  useDeleteInvoice,
  useMarkSent,
  useMarkUnpaid,
  useVoidInvoice,
} from "./invoices.mutations";

interface InvoiceRef {
  id: string;
  number: string;
  status: InvoiceStatus;
  clientName: string;
  paidAt: string | null;
  amountMinor: number;
  currency: "MKD" | "EUR" | "USD";
}

/** Invoice actions with their confirms, shared by rows, menus and the paid view. */
export const useInvoiceActions = () => {
  const { t } = useTranslation("finances");
  const confirm = useConfirm();
  const ledger = useLedgerMoney();
  const sent = useMarkSent();
  const unpaid = useMarkUnpaid();
  const voided = useVoidInvoice();
  const removed = useDeleteInvoice();

  return {
    markSent: (invoice: InvoiceRef) => {
      sent.mutate({ id: invoice.id, number: invoice.number });
    },
    markUnpaid: async (invoice: InvoiceRef): Promise<boolean> => {
      const ok = await confirm({
        confirmLabel: t("invoices.unpaidConfirm"),
        description: t("invoices.unpaidDescription", {
          amount: ledger.money(invoice.amountMinor, invoice.currency),
          date: invoice.paidAt === null ? "—" : formatShortDate(invoice.paidAt),
        }),
        title: t("invoices.unpaidTitle", { number: invoice.number }),
      });

      if (ok) {
        await unpaid.mutateAsync({ id: invoice.id, number: invoice.number });
      }

      return ok;
    },
    markVoid: (invoice: InvoiceRef) => {
      voided.mutate({ id: invoice.id, number: invoice.number });
    },
    remove: async (invoice: InvoiceRef, amount: string): Promise<boolean> => {
      const ok = await confirm({
        confirmLabel: t("invoices.deleteConfirm"),
        description: t("invoices.deleteDescription", {
          amount,
          client: invoice.clientName,
          status: t(`invoices.status.${invoice.status}`).toLocaleLowerCase(),
        }),
        title: t("invoices.deleteTitle", { number: invoice.number }),
        tone: "destructive",
      });

      if (ok) {
        await removed.mutateAsync({ id: invoice.id, number: invoice.number });
      }

      return ok;
    },
  };
};

/** Navigates to the ledger filtered to an invoice's entry (the "View" in the paid toast). */
export const useViewLedger = () => {
  const navigate = useNavigate();

  return (): void => {
    void navigate({ search: { kind: "income" }, to: "/finances/transactions" });
  };
};
