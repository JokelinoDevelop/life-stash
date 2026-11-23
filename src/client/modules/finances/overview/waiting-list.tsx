import { Link } from "@tanstack/react-router";
import { useRef } from "react";
import { useTranslation } from "react-i18next";

import { SwipeActions } from "@/components/app/swipe-actions";
import { Button } from "@/components/ui/button";
import { useHotkey } from "@/hooks/use-hotkey";
import { FINANCE_SHORTCUTS } from "@/lib/shortcuts";
import { cn } from "@/lib/utils";

import { FinanceDialogLink } from "../dialogs/finance-dialog-link";
import { useFinanceDialog } from "../dialogs/use-finance-dialog";
import { useInvoiceFor, useInvoiceNumber } from "../invoices/invoice-labels";
import { InvoiceStatusIcon } from "../invoices/invoice-status-icon";
import { useInvoiceSwipe } from "../invoices/use-invoice-swipe";
import { useLedgerMoney } from "../money";
import { OverviewSection } from "./overview-section";
import type { FinanceOverview } from "./overview.queries";

type Waiting = FinanceOverview["waiting"][number];

const useWhen = () => {
  const { t } = useTranslation("finances");

  return (invoice: Waiting, today: string): string => {
    if (invoice.status === "overdue") {
      return t("invoices.daysLate", { count: invoice.daysOverdue });
    }

    const days = Math.round(
      (Date.parse(invoice.dueDate) - Date.parse(today)) / 86_400_000
    );

    return days <= 0
      ? t("overview.dueToday")
      : t("overview.dueIn", { count: days });
  };
};

/** "Waiting for payment": sent invoices, oldest due first; hover / focus offers Mark paid `P`. */
export const WaitingList = ({ overview }: { overview: FinanceOverview }) => {
  const { t } = useTranslation("finances");
  const dialog = useFinanceDialog();
  const ledger = useLedgerMoney();
  const swipeFor = useInvoiceSwipe();
  const forLabel = useInvoiceFor();
  const numberOf = useInvoiceNumber();
  const when = useWhen();
  const focused = useRef<string | null>(null);

  useHotkey(FINANCE_SHORTCUTS.markPaid, () => {
    if (focused.current !== null) {
      void dialog.open({ dialog: "mark-paid", id: focused.current });
    }
  });

  if (overview.waiting.length === 0) {
    return null;
  }

  return (
    <OverviewSection
      action={
        <Link
          className="text-primary text-xs font-medium"
          to="/finances/invoices"
        >
          {t("overview.allInvoices")}
        </Link>
      }
      count={overview.waiting.length}
      title={t("overview.waiting")}
    >
      {overview.waiting.map((invoice) => {
        const overdue = invoice.status === "overdue";

        return (
          <li key={invoice.id}>
            <SwipeActions actions={swipeFor(invoice)}>
              {/* Remembers the focused row for the P shortcut; its link and buttons are the interactive parts. */}
              {/* oxlint-disable-next-line jsx-a11y/no-static-element-interactions */}
              <div
                className="group/row hover:bg-background max-md:active:bg-accent bg-card before:bg-primary relative flex min-h-13 items-center gap-3 px-3.5 transition-colors before:absolute before:inset-y-0 before:left-0 before:w-0.5 before:opacity-0 focus-within:before:opacity-100 md:min-h-10 md:px-5"
                onFocus={() => {
                  focused.current = invoice.id;
                }}
              >
                <InvoiceStatusIcon status={invoice.status} />
                <span className="text-muted-foreground hidden w-18 tabular-nums md:block">
                  {numberOf(invoice)}
                </span>
                <div className="flex min-w-0 flex-1 flex-col md:flex-row md:items-baseline md:gap-2">
                  <FinanceDialogLink
                    className="truncate font-medium outline-none after:absolute after:inset-0 focus-visible:underline"
                    entry={{ dialog: "invoice", id: invoice.id }}
                  >
                    {invoice.clientName}
                  </FinanceDialogLink>
                  <span className="text-muted-foreground truncate text-xs md:text-sm">
                    <span className="md:hidden">{numberOf(invoice)} · </span>
                    <span className="hidden md:inline">
                      {forLabel(invoice)}
                    </span>
                    <span
                      className={cn(
                        "md:hidden",
                        overdue && "text-destructive font-medium"
                      )}
                    >
                      {when(invoice, overview.today)}
                    </span>
                  </span>
                </div>
                <span className="relative z-10 hidden items-center gap-1.5 opacity-0 transition-opacity group-focus-within/row:opacity-100 group-hover/row:opacity-100 md:flex">
                  <Button
                    onClick={() => {
                      void dialog.open({ dialog: "mark-paid", id: invoice.id });
                    }}
                    size="xs"
                    variant="outline"
                  >
                    {t("invoices.markPaid")}
                  </Button>
                </span>
                <span
                  className={cn(
                    "hidden w-28 text-right text-sm tabular-nums md:block",
                    overdue
                      ? "text-destructive font-medium"
                      : "text-muted-foreground"
                  )}
                >
                  {when(invoice, overview.today)}
                </span>
                <span className="w-24 shrink-0 text-right font-medium tabular-nums">
                  {ledger.money(invoice.amountMinor, invoice.currency)}
                </span>
              </div>
            </SwipeActions>
          </li>
        );
      })}
    </OverviewSection>
  );
};
