import { domainError } from "../../../core/errors";
import type { InvoicePatch, InvoiceWithClient } from "./invoices.repository";

type VoidableInvoice = Pick<InvoiceWithClient, "status">;

/**
 * Voiding cancels a sent invoice: it stays listed (struck through) and its number stays used.
 * Returns the change, or null when it is already void.
 */
export const voidPatch = (
  invoice: VoidableInvoice,
  now: Date
): InvoicePatch | null => {
  if (invoice.status === "paid") {
    throw domainError("finances.invoice_already_paid");
  }

  if (invoice.status === "draft") {
    throw domainError("finances.invoice_not_issued");
  }

  if (invoice.status === "void") {
    return null;
  }

  return { status: "void", voidedAt: now.toISOString() };
};

/** Un-voiding puts it back to sent, keeping its number, dates and frozen details. */
export const unvoidPatch = (invoice: VoidableInvoice): InvoicePatch => {
  if (invoice.status !== "void") {
    throw domainError("finances.invoice_not_void");
  }

  return { status: "sent", voidedAt: null };
};
