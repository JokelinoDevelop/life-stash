import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import {
  ArrowDownLeft,
  Download,
  ArrowUpRight,
  CircleCheck,
  FileText,
  LayoutGrid,
  Plus,
  ReceiptText,
  Settings2,
  Users,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import { Item } from "@/components/app/command-menu-parts";
import { CommandGroup } from "@/components/ui/command";
import { todayIso } from "@/lib/partial-date";
import { FINANCE_SHORTCUTS } from "@/lib/shortcuts";

import { useFinanceDialog } from "./dialogs/use-finance-dialog";
import { useDueLabel } from "./invoices/invoice-labels";
import { invoicesQuery } from "./invoices/invoices.queries";
import { useLedgerMoney } from "./money";
import { exportUrl } from "./settings/export-url";

/** Closes the menu, then starts the given navigation. */
type Run = (start: () => Promise<void>) => void;

/** ⌘K actions for Finances (4.2). */
export const FinanceActionsGroup = ({ run }: { run: Run }) => {
  const { t } = useTranslation("finances");
  const { t: tc } = useTranslation("command");
  const dialog = useFinanceDialog();
  const navigate = useNavigate();

  return (
    <CommandGroup heading={`${t("title")} · ${tc("groups.actions")}`}>
      <Item
        icon={Plus}
        label={t("command.newInvoice")}
        onSelect={() => {
          run(async () => {
            await dialog.open({ dialog: "invoice" });
          });
        }}
        shortcut={FINANCE_SHORTCUTS.newInvoice}
      />
      <Item
        icon={CircleCheck}
        label={t("command.markInvoicePaid")}
        onSelect={() => {
          run(async () => {
            await navigate({
              search: { status: "unpaid" },
              to: "/finances/invoices",
            });
          });
        }}
        shortcut={FINANCE_SHORTCUTS.markPaid}
      />
      <Item
        icon={Download}
        label={t("command.exportInvoices")}
        onSelect={() => {
          run(async () => {
            window.location.assign(
              exportUrl("invoices", Number(todayIso().slice(0, 4)))
            );
            await Promise.resolve();
          });
        }}
      />
      <Item
        icon={Download}
        label={t("command.exportTransactions")}
        onSelect={() => {
          run(async () => {
            window.location.assign(
              exportUrl("transactions", Number(todayIso().slice(0, 4)))
            );
            await Promise.resolve();
          });
        }}
      />
      <Item
        icon={ArrowUpRight}
        label={t("command.logExpense")}
        onSelect={() => {
          run(async () => {
            await dialog.open({ dialog: "transaction", entryKind: "expense" });
          });
        }}
        shortcut={FINANCE_SHORTCUTS.logTransaction}
      />
      <Item
        icon={ArrowDownLeft}
        label={t("command.logIncome")}
        onSelect={() => {
          run(async () => {
            await dialog.open({ dialog: "transaction", entryKind: "income" });
          });
        }}
      />
    </CommandGroup>
  );
};

/** ⌘K: invoices by number and client, with status and amount; unpaid ones open Mark paid. */
export const FinanceInvoicesGroup = ({ run }: { run: Run }) => {
  const { t } = useTranslation("finances");
  const dialog = useFinanceDialog();
  const ledger = useLedgerMoney();
  const dueLabel = useDueLabel();
  const year = Number(todayIso().slice(0, 4));
  const invoices = useQuery(invoicesQuery({ status: "all", year }));
  const rows = invoices.data?.invoices ?? [];

  if (rows.length === 0) {
    return null;
  }

  return (
    <CommandGroup heading={t("command.invoicesGroup")}>
      {rows.map((invoice) => (
        <Item
          icon={FileText}
          key={invoice.id}
          keywords={[invoice.number, invoice.clientName]}
          label={`${invoice.number} · ${invoice.clientName}`}
          meta={`${ledger.money(invoice.amountMinor, invoice.currency)} · ${dueLabel(invoice)}`}
          onSelect={() => {
            run(async () => {
              await (invoice.status === "sent" || invoice.status === "overdue"
                ? dialog.open({ dialog: "mark-paid", id: invoice.id })
                : dialog.open({ dialog: "invoice", id: invoice.id }));
            });
          }}
        />
      ))}
    </CommandGroup>
  );
};

/** ⌘K "Go to" entries for Finances. */
export const FinancePagesGroup = ({ run }: { run: Run }) => {
  const { t } = useTranslation("finances");
  const { t: tc } = useTranslation("command");
  const navigate = useNavigate();

  const pages = [
    { icon: LayoutGrid, label: t("command.overview"), to: "/finances" },
    {
      icon: ReceiptText,
      label: t("command.transactions"),
      to: "/finances/transactions",
    },
    { icon: FileText, label: t("command.invoices"), to: "/finances/invoices" },
    { icon: Users, label: t("command.clients"), to: "/finances/clients" },
    {
      icon: Settings2,
      label: t("command.financeSettings"),
      to: "/settings/finances",
    },
  ] as const;

  return (
    <CommandGroup heading={`${t("title")} · ${tc("groups.goTo")}`}>
      {pages.map((page) => (
        <Item
          icon={page.icon}
          key={page.to}
          label={page.label}
          onSelect={() => {
            run(async () => {
              await navigate({ to: page.to });
            });
          }}
        />
      ))}
    </CommandGroup>
  );
};
