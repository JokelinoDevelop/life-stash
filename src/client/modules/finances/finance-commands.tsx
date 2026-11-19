import { useNavigate } from "@tanstack/react-router";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ReceiptText,
  Settings2,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import { Item } from "@/components/app/command-menu-parts";
import { CommandGroup } from "@/components/ui/command";
import { FINANCE_SHORTCUTS } from "@/lib/shortcuts";

import { useFinanceDialog } from "./dialogs/use-finance-dialog";

/** Closes the menu, then starts the given navigation. */
type Run = (start: () => Promise<void>) => void;

/** ⌘K actions for Finances (4.2). */
export const FinanceActionsGroup = ({ run }: { run: Run }) => {
  const { t } = useTranslation("finances");
  const { t: tc } = useTranslation("command");
  const dialog = useFinanceDialog();

  return (
    <CommandGroup heading={`${t("title")} · ${tc("groups.actions")}`}>
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

/** ⌘K "Go to" entries for Finances. */
export const FinancePagesGroup = ({ run }: { run: Run }) => {
  const { t } = useTranslation("finances");
  const { t: tc } = useTranslation("command");
  const navigate = useNavigate();

  return (
    <CommandGroup heading={`${t("title")} · ${tc("groups.goTo")}`}>
      <Item
        icon={ReceiptText}
        label={t("command.transactions")}
        onSelect={() => {
          run(async () => {
            await navigate({ to: "/finances/transactions" });
          });
        }}
      />
      <Item
        icon={Settings2}
        label={t("command.financeSettings")}
        onSelect={() => {
          run(async () => {
            await navigate({ to: "/settings/finances" });
          });
        }}
      />
    </CommandGroup>
  );
};
