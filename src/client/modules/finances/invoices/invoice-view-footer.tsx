import { Ban, Copy, Download, MoreHorizontal, Undo2 } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { useIsDesktop } from "@/components/app/responsive-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useFinanceDialog } from "../dialogs/use-finance-dialog";
import { useDownloadInvoicePdf } from "./invoice-document";
import type { InvoiceDetail } from "./invoices.queries";
import { useInvoiceActions } from "./use-invoice-actions";

interface FooterAction {
  id: string;
  icon?: ReactNode;
  label: string;
  onSelect: () => void;
}

/**
 * Phones: the main action full width (48px) with the rest in a "…" menu
 * beside it, like every sheet footer, instead of a wrapping row of buttons.
 */
const PhoneFooter = ({
  primary,
  secondary,
}: {
  primary: FooterAction;
  secondary: FooterAction[];
}) => {
  const { t } = useTranslation();

  return (
    <div className="border-divider pb-safe-2.5 flex shrink-0 items-center gap-2 border-t px-3 pt-2.5">
      {secondary.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                aria-label={t("actions.more")}
                className="size-12"
                size="icon-compact"
                variant="outline"
              />
            }
          >
            <MoreHorizontal />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56" side="top">
            {secondary.map((action) => (
              <DropdownMenuItem
                key={action.id}
                onClick={() => {
                  action.onSelect();
                }}
              >
                {action.icon}
                {action.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      <Button
        onClick={() => {
          primary.onSelect();
        }}
        size="submit"
      >
        {primary.icon}
        {primary.label}
      </Button>
    </div>
  );
};

/** Footer actions by status: void / mark paid (sent), mark unpaid (paid), duplicate (all). */
export const ViewFooter = ({
  invoice,
  onClose,
}: {
  invoice: InvoiceDetail;
  onClose: () => Promise<void>;
}) => {
  const { t } = useTranslation("finances");
  const dialog = useFinanceDialog();
  const actions = useInvoiceActions();
  const download = useDownloadInvoicePdf();
  const isDesktop = useIsDesktop();
  const unpaid = invoice.status === "sent" || invoice.status === "overdue";

  const markVoid = async () => {
    if (await actions.markVoid(invoice)) {
      await onClose();
    }
  };

  const downloadPdf = () => {
    void download(invoice);
  };

  const markUnpaid = () => {
    void actions.markUnpaid(invoice);
  };

  const duplicate = () => {
    void dialog.open({ dialog: "invoice", duplicate: invoice.id });
  };

  const markPaid = () => {
    void dialog.open({ dialog: "mark-paid", id: invoice.id });
  };

  if (!isDesktop) {
    const duplicateAction: FooterAction = {
      icon: <Copy />,
      id: "duplicate",
      label: t("invoices.duplicate"),
      onSelect: duplicate,
    };

    const secondary: FooterAction[] = [];

    if (invoice.itemised) {
      secondary.push({
        icon: <Download />,
        id: "download",
        label: t("invoices.downloadPdf"),
        onSelect: downloadPdf,
      });
    }

    if (unpaid) {
      secondary.push(duplicateAction, {
        icon: <Ban />,
        id: "void",
        label: t("invoices.void"),
        onSelect: () => {
          void markVoid();
        },
      });
    }

    if (invoice.status === "paid") {
      secondary.push({
        icon: <Undo2 />,
        id: "unpaid",
        label: t("invoices.unpaidConfirm"),
        onSelect: markUnpaid,
      });
    }

    return (
      <PhoneFooter
        primary={
          unpaid
            ? { id: "paid", label: t("invoices.markPaid"), onSelect: markPaid }
            : duplicateAction
        }
        secondary={secondary}
      />
    );
  }

  return (
    <div className="border-divider pb-safe-2.5 flex shrink-0 flex-wrap items-center gap-2 border-t px-3 pt-2.5">
      {unpaid && (
        <Button
          onClick={() => {
            void markVoid();
          }}
          size="compact"
          variant="ghost"
        >
          {t("invoices.void")}
        </Button>
      )}
      <span className="flex-1" />
      {invoice.itemised && (
        <Button onClick={downloadPdf} size="compact" variant="outline">
          <Download />
          {t("invoices.downloadPdf")}
        </Button>
      )}
      {invoice.status === "paid" && (
        <Button onClick={markUnpaid} size="compact" variant="outline">
          {t("invoices.unpaidConfirm")}
        </Button>
      )}
      <Button
        onClick={duplicate}
        size="compact"
        variant={unpaid ? "outline" : "default"}
      >
        {t("invoices.duplicate")}
      </Button>
      {unpaid && (
        <Button onClick={markPaid} size="compact">
          {t("invoices.markPaid")}
        </Button>
      )}
    </div>
  );
};
