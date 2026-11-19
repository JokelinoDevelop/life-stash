import {
  Ban,
  Copy,
  Eye,
  MoreHorizontal,
  Pencil,
  RotateCcw,
  Send,
  Trash2,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import { useConfirm } from "@/components/app/confirm/confirm-context";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useFinanceDialog } from "../dialogs/use-finance-dialog";
import { useLedgerMoney } from "../money";
import type { InvoiceListItem } from "./invoices.queries";
import { useInvoiceActions } from "./use-invoice-actions";

/** ⋯ on an invoice row: view / edit, send, mark unpaid, duplicate, void, delete. */
export const InvoiceMenu = ({ invoice }: { invoice: InvoiceListItem }) => {
  const { t } = useTranslation("finances");
  const { t: tc } = useTranslation();
  const dialog = useFinanceDialog();
  const confirm = useConfirm();
  const ledger = useLedgerMoney();
  const actions = useInvoiceActions();
  const paid = invoice.status === "paid";
  const open = invoice.status !== "paid" && invoice.status !== "void";

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
          {paid ? <Eye /> : <Pencil />}
          {paid ? t("invoices.viewAction") : tc("actions.edit")}
        </DropdownMenuItem>
        {invoice.status === "draft" && (
          <DropdownMenuItem
            onClick={() => {
              actions.markSent(invoice);
            }}
          >
            <Send />
            {t("invoices.markSent")}
          </DropdownMenuItem>
        )}
        {paid && (
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
        {open && (
          <DropdownMenuItem
            onClick={async () => {
              const ok = await confirm({
                confirmLabel: t("invoices.void"),
                description: t("invoices.voidDescription"),
                title: t("invoices.voidTitle", { number: invoice.number }),
              });

              if (ok) {
                actions.markVoid(invoice);
              }
            }}
          >
            <Ban />
            {t("invoices.void")}
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            void actions.remove(
              invoice,
              ledger.money(invoice.amountMinor, invoice.currency)
            );
          }}
          variant="destructive"
        >
          <Trash2 />
          {tc("actions.delete")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
