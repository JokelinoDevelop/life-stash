import { formatShortDate } from "@shared/domain/dates";
import type { InvoiceStatus } from "@shared/domain/finances/invoices";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { useConfirm } from "@/components/app/confirm/confirm-context";
import { useConfig } from "@/lib/session";

import { useLedgerMoney } from "../money";
import { useStoreInvoicePdf } from "./invoice-document";
import { useInvoiceNumber } from "./invoice-labels";
import {
  useDeleteInvoice,
  useIssueInvoice,
  useMarkUnpaid,
  useUnvoidInvoice,
  useVoidInvoice,
} from "./invoices.mutations";
import { nextInvoiceNumberQuery } from "./invoices.queries";

interface InvoiceRef {
  id: string;
  number: string | null;
  status: InvoiceStatus;
  clientName: string;
  issueDate: string;
  paidAt: string | null;
  amountMinor: number;
  currency: "MKD" | "EUR" | "USD";
  /** Has lines: issuing also draws and keeps its PDF. */
  itemised: boolean;
}

/** Asks "Issue invoice 2026-012?" with the number it will get; resolves whether confirmed. */
export const useConfirmIssue = () => {
  const { t } = useTranslation("finances");
  const confirm = useConfirm();
  const queryClient = useQueryClient();

  const nextFor = async (issueDate: string): Promise<string> => {
    const next = await queryClient.query(
      nextInvoiceNumberQuery(Number(issueDate.slice(0, 4)))
    );

    return next.number;
  };

  return async (issueDate: string, typed: string | null): Promise<boolean> => {
    const number = typed ?? (await nextFor(issueDate));

    return await confirm({
      confirmLabel: t("invoices.issueConfirm"),
      description: t("invoices.issueDescription"),
      title: t("invoices.issueTitle", { number }),
    });
  };
};

/** Invoice actions with their confirms, shared by rows, menus and the invoice view. */
export const useInvoiceActions = () => {
  const { t } = useTranslation("finances");
  const confirm = useConfirm();
  const confirmIssue = useConfirmIssue();
  const ledger = useLedgerMoney();
  const label = useInvoiceNumber();
  const issued = useIssueInvoice();
  const unpaid = useMarkUnpaid();
  const voided = useVoidInvoice();
  const unvoided = useUnvoidInvoice();
  const storage = useConfig().data?.photosEnabled === true;
  const removed = useDeleteInvoice();
  const storePdf = useStoreInvoicePdf();

  return {
    /** Issues a draft with the next number of its issue year. */
    issue: async (invoice: InvoiceRef): Promise<string | null> => {
      if (!(await confirmIssue(invoice.issueDate, null))) {
        return null;
      }

      const result = await issued.mutateAsync({ id: invoice.id, number: null });

      if (invoice.itemised) {
        await storePdf(result, { download: false });
      }

      return result.number;
    },
    markUnpaid: async (invoice: InvoiceRef): Promise<boolean> => {
      const ok = await confirm({
        confirmLabel: t("invoices.unpaidConfirm"),
        description: t("invoices.unpaidDescription", {
          amount: ledger.money(invoice.amountMinor, invoice.currency),
          date: invoice.paidAt === null ? "—" : formatShortDate(invoice.paidAt),
        }),
        title: t("invoices.unpaidTitle", { number: label(invoice) }),
      });

      if (ok) {
        await unpaid.mutateAsync({ id: invoice.id, label: label(invoice) });
      }

      return ok;
    },
    markVoid: async (invoice: InvoiceRef): Promise<boolean> => {
      const ok = await confirm({
        confirmLabel: t("invoices.void"),
        description: t("invoices.voidDescription"),
        title: t("invoices.voidTitle", { number: label(invoice) }),
        tone: "destructive",
      });

      if (ok) {
        await voided.mutateAsync({ id: invoice.id, label: label(invoice) });
      }

      return ok;
    },
    unvoid: async (invoice: InvoiceRef): Promise<boolean> => {
      const ok = await confirm({
        confirmLabel: t("invoices.unvoid"),
        description: t("invoices.unvoidDescription"),
        title: t("invoices.unvoidTitle", { number: label(invoice) }),
      });

      if (ok) {
        await unvoided.mutateAsync({ id: invoice.id, label: label(invoice) });
      }

      return ok;
    },
    /** Issued itemised invoices keep a PDF in storage; it can be redrawn from the frozen data. */
    canRegeneratePdf: (invoice: InvoiceRef): boolean =>
      storage && invoice.itemised && invoice.status !== "draft",
    /** Draws the PDF again from the frozen data and replaces the stored file. */
    regeneratePdf: async (invoice: InvoiceRef): Promise<boolean> => {
      const number = label(invoice);

      const ok = await confirm({
        confirmLabel: t("invoices.regeneratePdf"),
        description: t("invoices.regenerateDescription"),
        title: t("invoices.regenerateTitle", { number }),
      });

      if (
        ok &&
        (await storePdf(
          { id: invoice.id, number },
          { download: false, replace: true }
        ))
      ) {
        toast.success(t("invoices.pdfRegenerated", { number }));

        return true;
      }

      return false;
    },
    /** Deletes a draft (issued invoices are voided instead). */
    remove: async (invoice: InvoiceRef): Promise<boolean> => {
      const ok = await confirm({
        confirmLabel: t("invoices.deleteDraftConfirm"),
        description: t("invoices.deleteDraftDescription", {
          amount: ledger.money(invoice.amountMinor, invoice.currency),
        }),
        title: t("invoices.deleteDraftTitle", { client: invoice.clientName }),
        tone: "destructive",
      });

      if (ok) {
        await removed.mutateAsync({ id: invoice.id, label: label(invoice) });
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
