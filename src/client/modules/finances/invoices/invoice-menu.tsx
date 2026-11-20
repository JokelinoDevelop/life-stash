import {
  Ban,
  Copy,
  Download,
  Eye,
  MoreHorizontal,
  Pencil,
  RotateCcw,
  Send,
  Trash2,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useFinanceDialog } from "../dialogs/use-finance-dialog";
import { useDownloadInvoicePdf } from "./invoice-document";
import type { InvoiceListItem } from "./invoices.queries";
import { useInvoiceActions } from "./use-invoice-actions";

/**
 * ⋯ on an invoice row. Drafts: edit, issue, duplicate, delete. Issued: view, duplicate,
 * mark unpaid (paid) or void (sent).
 */
export const InvoiceMenu = ({ invoice }: { invoice: InvoiceListItem }) => {
  const { t } = useTranslation("finances");
  const { t: tc } = useTranslation();
  const dialog = useFinanceDialog();
  const actions = useInvoiceActions();
  const download = useDownloadInvoicePdf();
  const draft = invoice.status === "draft";
  const unpaid = invoice.status === "sent" || invoice.status === "overdue";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            aria-label={tc("actions.more")}
            size="icon-xs"
            variant="ghost"
          />
        }
      >
        <MoreHorizontal />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem
          onClick={() => {
            void dialog.open({ dialog: "invoice", id: invoice.id });
          }}
        >
          {draft ? <Pencil /> : <Eye />}
          {draft ? tc("actions.edit") : t("invoices.viewAction")}
        </DropdownMenuItem>
        {draft && (
          <DropdownMenuItem
            onClick={() => {
              void actions.issue(invoice);
            }}
          >
            <Send />
            {t("invoices.issue")}
          </DropdownMenuItem>
        )}
        {!draft && invoice.itemised && (
          <DropdownMenuItem
            onClick={() => {
              void download(invoice);
            }}
          >
            <Download />
            {t("invoices.downloadPdf")}
          </DropdownMenuItem>
        )}
        {invoice.status === "paid" && (
          <DropdownMenuItem
            onClick={() => {
              void actions.markUnpaid(invoice);
            }}
          >
            <RotateCcw />
            {t("invoices.unpaidConfirm")}
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          onClick={() => {
            void dialog.open({ dialog: "invoice", duplicate: invoice.id });
          }}
        >
          <Copy />
          {t("invoices.duplicate")}
        </DropdownMenuItem>
        {unpaid && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                void actions.markVoid(invoice);
              }}
              variant="destructive"
            >
              <Ban />
              {t("invoices.void")}
            </DropdownMenuItem>
          </>
        )}
        {draft && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                void actions.remove(invoice);
              }}
              variant="destructive"
            >
              <Trash2 />
              {tc("actions.delete")}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
