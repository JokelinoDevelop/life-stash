import { formatShortDate } from "@shared/domain/dates";
import type { InvoiceStatus } from "@shared/domain/finances/invoices";
import { useTranslation } from "react-i18next";

import { useMonthLabel } from "../transactions/month-band";

interface InvoiceLike {
  status: InvoiceStatus;
  dueDate: string;
  paidAt: string | null;
  daysOverdue: number;
  description: string | null;
  periodStart: string | null;
}

/** "14 days late", "due 30.11", "paid 28.10", "not sent". */
export const useDueLabel = () => {
  const { t } = useTranslation("finances");

  return (invoice: InvoiceLike): string => {
    if (invoice.status === "overdue") {
      return t("invoices.daysLate", { count: invoice.daysOverdue });
    }

    if (invoice.status === "paid" && invoice.paidAt !== null) {
      return t("invoices.paidOn", { date: formatShortDate(invoice.paidAt) });
    }

    if (invoice.status === "draft") {
      return t("invoices.notSent");
    }

    if (invoice.status === "void") {
      return t("invoices.status.void").toLocaleLowerCase();
    }

    return t("invoices.due", { date: formatShortDate(invoice.dueDate) });
  };
};

/** What the invoice is for: its work period ("October 2026") or its description. */
export const useInvoiceFor = () => {
  const month = useMonthLabel();

  return (
    invoice: Pick<InvoiceLike, "periodStart" | "description"> & {
      projectName?: string | null;
    }
  ): string => {
    const what =
      invoice.periodStart === null
        ? (invoice.description ?? "—")
        : month(invoice.periodStart.slice(0, 7));

    const project = invoice.projectName ?? null;

    // Skip the prefix when the description already names the project.
    return project === null || what.startsWith(project)
      ? what
      : `${project} · ${what}`;
  };
};

/** The invoice's number, or "Draft" until it is issued. */
export const useInvoiceNumber = () => {
  const { t } = useTranslation("finances");

  return (invoice: { number: string | null }): string =>
    invoice.number ?? t("invoices.draftNumber");
};
