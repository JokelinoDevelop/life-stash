import { formatShortDate } from "@shared/domain/dates";
import { Paperclip } from "lucide-react";
import { useTranslation } from "react-i18next";

import { SwipeActions } from "@/components/app/swipe-actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { FinanceDialogLink } from "../dialogs/finance-dialog-link";
import { useFinanceDialog } from "../dialogs/use-finance-dialog";
import { useLedgerMoney } from "../money";
import { useDueLabel, useInvoiceFor, useInvoiceNumber } from "./invoice-labels";
import { InvoiceMenu } from "./invoice-menu";
import { InvoiceStatusIcon } from "./invoice-status-icon";
import type { InvoiceListItem } from "./invoices.queries";
import { useInvoiceActions } from "./use-invoice-actions";
import { useInvoiceSwipe } from "./use-invoice-swipe";

/** Desktop columns: status · number · client · for · issued · due/paid · amount · actions. */
export const INVOICE_GRID =
  "md:grid md:grid-cols-[16px_72px_minmax(120px,170px)_minmax(0,1fr)_84px_110px_96px_112px] md:gap-3";

const MUTED = "text-muted-foreground";

const ROW_CLASS =
  "group/row bg-card hover:bg-background max-md:active:bg-accent relative flex min-h-13 items-center gap-3 px-3.5 transition-colors md:min-h-0 md:flex-1 md:px-5 before:bg-primary before:absolute before:inset-y-0 before:left-0 before:w-0.5 before:opacity-0 focus-within:before:opacity-100";

const RowAction = ({ invoice }: { invoice: InvoiceListItem }) => {
  const { t } = useTranslation("finances");
  const dialog = useFinanceDialog();
  const actions = useInvoiceActions();

  if (invoice.status === "draft") {
    return (
      <Button
        onClick={() => {
          void actions.issue(invoice);
        }}
        size="xs"
        variant="ghost"
      >
        {t("invoices.issue")}
      </Button>
    );
  }

  if (invoice.status === "sent" || invoice.status === "overdue") {
    return (
      <Button
        onClick={() => {
          void dialog.open({ dialog: "mark-paid", id: invoice.id });
        }}
        size="xs"
        variant="outline"
      >
        {t("invoices.markPaid")}
      </Button>
    );
  }

  return null;
};

/** Drafts and void invoices are muted (void struck through); overdue shows it in the meta line. */
const amountClass = (status: InvoiceListItem["status"]): string =>
  cn(
    "shrink-0 text-right tabular-nums",
    status === "draft" || status === "void" ? MUTED : "font-medium",
    status === "void" && "line-through",
    status === "overdue" && "hidden md:block"
  );

/** One invoice: a grid row on desktop (actions on hover / focus), two lines on phones. */
export const InvoiceRow = ({
  invoice,
  onFocus,
}: {
  invoice: InvoiceListItem;
  onFocus: (invoiceId: string) => void;
}) => {
  const { t } = useTranslation("finances");
  const ledger = useLedgerMoney();
  const dueLabel = useDueLabel();
  const forLabel = useInvoiceFor();
  const numberOf = useInvoiceNumber();
  const overdue = invoice.status === "overdue";
  const voided = invoice.status === "void";
  const amount = ledger.money(invoice.amountMinor, invoice.currency);
  const swipeFor = useInvoiceSwipe();

  // Phones: two facts so the line never truncates — the number (the amount
  // when overdue, since Mark paid takes the trailing slot) and when it's due.
  const mobileMeta = [
    overdue ? amount : numberOf(invoice),
    dueLabel(invoice),
  ].join(" · ");

  return (
    <li className="md:flex md:min-h-10 md:flex-col">
      <SwipeActions actions={swipeFor(invoice)}>
        {/* Remembers the focused row for the P shortcut; its link and buttons are the interactive parts. */}
        {/* oxlint-disable-next-line jsx-a11y/no-static-element-interactions */}
        <div
          className={cn(ROW_CLASS, INVOICE_GRID)}
          onFocus={() => {
            onFocus(invoice.id);
          }}
        >
          <InvoiceStatusIcon status={invoice.status} />
          <span
            className={cn(
              "text-muted-foreground hidden truncate tabular-nums md:block",
              voided && "line-through"
            )}
          >
            {numberOf(invoice)}
          </span>
          <div className="flex min-w-0 flex-1 flex-col md:contents">
            <FinanceDialogLink
              className={cn(
                "truncate font-medium outline-none after:absolute after:inset-0 focus-visible:underline",
                voided && "text-muted-foreground line-through"
              )}
              entry={{ dialog: "invoice", id: invoice.id }}
            >
              {invoice.clientName}
            </FinanceDialogLink>
            <span
              className={cn(
                "truncate text-xs tabular-nums md:hidden",
                overdue ? "text-destructive" : MUTED
              )}
            >
              {mobileMeta}
            </span>
            <span className="text-muted-foreground hidden min-w-0 items-center gap-1.5 md:flex">
              <span className="truncate">{forLabel(invoice)}</span>
              {invoice.attachments > 0 && (
                <>
                  <Paperclip aria-hidden="true" className="size-3 shrink-0" />
                  <span className="sr-only">
                    {t("invoices.filesAttached", {
                      count: invoice.attachments,
                    })}
                  </span>
                </>
              )}
            </span>
          </div>
          <span className="text-muted-foreground hidden tabular-nums md:block">
            {invoice.status === "draft"
              ? "—"
              : formatShortDate(invoice.issueDate)}
          </span>
          <span
            className={cn(
              "hidden tabular-nums md:block",
              overdue ? "text-destructive font-medium" : MUTED,
              invoice.status === "sent" && "text-foreground"
            )}
          >
            {dueLabel(invoice)}
          </span>
          <span className={amountClass(invoice.status)}>{amount}</span>
          <span className="relative z-10 flex shrink-0 items-center justify-end gap-0.5 md:opacity-0 md:transition-opacity md:group-focus-within/row:opacity-100 md:group-hover/row:opacity-100 md:focus-within:opacity-100">
            <span className={cn(!overdue && "hidden md:inline-flex")}>
              <RowAction invoice={invoice} />
            </span>
            <span className="hidden md:inline-flex">
              <InvoiceMenu invoice={invoice} />
            </span>
          </span>
        </div>
      </SwipeActions>
    </li>
  );
};
