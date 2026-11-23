import { formatShortDate } from "@shared/domain/dates";
import { Copy, MoreHorizontal, Paperclip, Pencil, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useConfirm } from "@/components/app/confirm/confirm-context";
import { Money } from "@/components/app/money";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

import { CategoryIcon } from "../categories/category-icon";
import { useCategoryName } from "../categories/category-label";
import { FinanceDialogLink } from "../dialogs/finance-dialog-link";
import { useFinanceDialog } from "../dialogs/use-finance-dialog";
import { SwipeToDelete } from "./swipe-to-delete";
import { useDeleteTransaction } from "./transactions.mutations";
import type { TransactionListItem } from "./transactions.queries";

const ROW_CLASS =
  "group/row bg-card hover:bg-background relative flex min-h-13 items-center gap-3 px-3.5 transition-colors md:min-h-10 md:px-5";

/** Desktop columns: icon · description · category · date · amount · actions. */
export const TRANSACTION_GRID =
  "md:grid md:grid-cols-[24px_minmax(140px,1fr)_150px_150px_64px_104px_56px] md:gap-3";

const RowMenu = ({ transaction }: { transaction: TransactionListItem }) => {
  const { t } = useTranslation("finances");
  const { t: tc } = useTranslation();
  const dialog = useFinanceDialog();
  const confirm = useConfirm();
  const remove = useDeleteTransaction();

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
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem
          onClick={() => {
            void dialog.open({ dialog: "transaction", id: transaction.id });
          }}
        >
          <Pencil />
          {tc("actions.edit")}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            void dialog.open({
              dialog: "transaction",
              duplicate: transaction.id,
            });
          }}
        >
          <Copy />
          {t("transactions.duplicate")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={async () => {
            const ok = await confirm({
              description: t("transactions.deleteDescription", {
                description: transaction.description,
              }),
              title: t("transactions.deleteTitle"),
              tone: "destructive",
            });

            if (ok) {
              remove.mutate(transaction.id);
            }
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

/** One ledger row: a grid on desktop, a two-line row with swipe-to-delete on phones. */
export const TransactionRow = ({
  transaction,
}: {
  transaction: TransactionListItem;
}) => {
  const { t } = useTranslation("finances");
  const nameOf = useCategoryName();
  const remove = useDeleteTransaction();
  const income = transaction.kind === "income";
  const category = nameOf(transaction.category);

  const linked = transaction.invoice;

  const meta = [
    category,
    transaction.client?.name,
    formatShortDate(transaction.date),
  ].filter((part) => part !== undefined);

  const row = (
    <div className={cn(ROW_CLASS, TRANSACTION_GRID)}>
      <CategoryIcon name={transaction.category.icon} />
      <div className="flex min-w-0 flex-1 flex-col md:block">
        <FinanceDialogLink
          className="flex min-w-0 items-center gap-1.5 font-medium outline-none after:absolute after:inset-0 focus-visible:underline"
          entry={
            linked === null
              ? { dialog: "transaction", id: transaction.id }
              : { dialog: "invoice", id: linked.id }
          }
        >
          <span className="truncate">{transaction.description}</span>
          {transaction.attachments > 0 && (
            <>
              <Paperclip
                aria-hidden="true"
                className="text-muted-foreground size-3 shrink-0"
              />
              <span className="sr-only">
                {t("receipts.files", {
                  count: transaction.attachments,
                })}
              </span>
            </>
          )}
        </FinanceDialogLink>
        <span className="text-muted-foreground truncate text-xs md:hidden">
          {meta.join(" · ")}
        </span>
      </div>
      <span className="text-subtle-foreground hidden min-w-0 items-center gap-1.5 md:flex">
        <span
          aria-hidden="true"
          className={cn(
            "size-1.5 shrink-0 rounded-full",
            income ? "bg-success" : "bg-muted-foreground/40"
          )}
        />
        <span className="truncate">{category}</span>
      </span>
      <span className="text-muted-foreground hidden truncate md:block">
        {transaction.client?.name ?? "—"}
      </span>
      <span className="text-muted-foreground hidden tabular-nums md:block">
        {formatShortDate(transaction.date)}
      </span>
      <Money
        amountMinor={transaction.amountMinor}
        className={cn(
          "shrink-0 text-right",
          income && "text-success-foreground font-medium"
        )}
        currency={transaction.currency}
        sign={income ? "+" : "−"}
        variant="ledger"
      />
      <span className="relative z-10 hidden justify-end gap-0.5 opacity-0 transition-opacity group-hover/row:opacity-100 focus-within:opacity-100 md:flex">
        {linked === null && (
          <>
            <FinanceDialogLink
              aria-label={t("transactions.duplicate")}
              className="text-muted-foreground hover:bg-accent hover:text-foreground flex size-6 items-center justify-center rounded-md"
              entry={{ dialog: "transaction", duplicate: transaction.id }}
            >
              <Copy className="size-3.5" />
            </FinanceDialogLink>
            <RowMenu transaction={transaction} />
          </>
        )}
      </span>
    </div>
  );

  if (linked !== null) {
    return <li>{row}</li>;
  }

  return (
    <li>
      <SwipeToDelete
        label={t("transactions.swipeDelete")}
        onDelete={() => {
          remove.mutate(transaction.id);
        }}
      >
        {row}
      </SwipeToDelete>
    </li>
  );
};
