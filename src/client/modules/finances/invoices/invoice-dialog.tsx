import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { FormDialog } from "@/components/app/form-dialog";
import { ErrorState, FormSkeleton } from "@/components/app/states";

import type { InvoiceMode } from "./forms/invoice-form/invoice-form";
import { EditDraft, NewInvoice } from "./invoice-editors";
import { useInvoiceNumber } from "./invoice-labels";
import { InvoiceView } from "./invoice-view";
import { invoiceQuery } from "./invoices.queries";
import type { InvoiceDetail } from "./invoices.queries";

type Close = () => Promise<void>;

/** Loads the invoice; drafts open the editor, issued ones the locked view. */
const ExistingInvoice = ({
  invoiceId,
  onClose,
  onModeChange,
}: {
  invoiceId: string;
  onClose: Close;
  onModeChange: (mode: InvoiceMode) => void;
}) => {
  const detail = useQuery(invoiceQuery(invoiceId));

  if (detail.isPending) {
    return <FormSkeleton fields={6} />;
  }

  if (detail.isError) {
    return (
      <ErrorState
        className="m-4 md:m-4"
        error={detail.error}
        onRetry={() => {
          void detail.refetch();
        }}
      />
    );
  }

  const { invoice } = detail.data;

  return invoice.status === "draft" ? (
    <EditDraft
      invoice={invoice}
      onClose={onClose}
      onModeChange={onModeChange}
    />
  ) : (
    <InvoiceView invoice={invoice} onClose={onClose} />
  );
};

/** Full size for the itemised editor (it has the preview); issued invoices and recorded ones are narrower. */
const dialogSize = (
  invoice: InvoiceDetail | undefined,
  isNew: boolean,
  chosen: InvoiceMode | null
): "lg" | "full" => {
  if (!isNew && (invoice === undefined || invoice.status !== "draft")) {
    return "lg";
  }

  const mode =
    chosen ?? (invoice?.itemised === false ? "recorded" : "itemised");

  return mode === "itemised" ? "full" : "lg";
};

/** `?dialog=invoice` (+ `id` to edit/view, `duplicate`, `forClient`). */
export const InvoiceDialog = ({
  duplicateId,
  forClient,
  invoiceId,
  onClose,
  onOpenChange,
  open,
}: {
  duplicateId: string | undefined;
  forClient: string | undefined;
  invoiceId: string | undefined;
  onClose: Close;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}) => {
  const { t } = useTranslation("finances");
  const numberOf = useInvoiceNumber();
  const [mode, setMode] = useState<InvoiceMode | null>(null);

  const detail = useQuery({
    ...invoiceQuery(invoiceId ?? duplicateId ?? ""),
    enabled: invoiceId !== undefined || duplicateId !== undefined,
  });

  const invoice = detail.data?.invoice;
  let title = t("invoices.newTitle");

  if (invoiceId !== undefined) {
    title = invoice === undefined ? t("invoices.editTitle") : numberOf(invoice);
  }

  return (
    <FormDialog
      crumb={<span>{t("invoices.title")}</span>}
      onOpenChange={onOpenChange}
      open={open}
      size={dialogSize(invoice, invoiceId === undefined, mode)}
      title={title}
    >
      {invoiceId === undefined ? (
        <NewInvoice
          duplicateId={duplicateId}
          forClient={forClient}
          onClose={onClose}
          onModeChange={setMode}
        />
      ) : (
        <ExistingInvoice
          invoiceId={invoiceId}
          onClose={onClose}
          onModeChange={setMode}
        />
      )}
    </FormDialog>
  );
};
