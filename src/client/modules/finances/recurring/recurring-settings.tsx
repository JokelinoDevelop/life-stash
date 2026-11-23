import { useQuery } from "@tanstack/react-query";
import { MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useConfirm } from "@/components/app/confirm/confirm-context";
import { ErrorState, LoadingState } from "@/components/app/states";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { useListMotion } from "@/lib/motion";
import { SettingsSection } from "@/modules/settings/settings-section";

import { CategoryIcon } from "../categories/category-icon";
import { useFinanceDialog } from "../dialogs/use-finance-dialog";
import { useLedgerMoney } from "../money";
import { useMonthLabel } from "../transactions/month-band";
import {
  recurringQuery,
  useDeleteRecurring,
  useUpdateRecurring,
} from "./recurring.queries";
import type { RecurringItem } from "./recurring.queries";

const Row = ({ item }: { item: RecurringItem }) => {
  const { t } = useTranslation("finances");
  const { t: tc } = useTranslation();
  const ledger = useLedgerMoney();
  const month = useMonthLabel();
  const dialog = useFinanceDialog();
  const confirm = useConfirm();
  const toggle = useUpdateRecurring(false);
  const remove = useDeleteRecurring();

  const meta = [
    item.client?.name ?? null,
    t("recurring.onDay", { count: item.dayOfMonth, ordinal: true }),
    item.lastHandledMonth === null
      ? t("recurring.never")
      : t("recurring.lastConfirmed", {
          month: month(item.lastHandledMonth, false),
        }),
  ].filter((part) => part !== null);

  return (
    <li className="flex min-h-14 items-center gap-2.5 px-3 md:min-h-12">
      <CategoryIcon name={item.category.icon} />
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-medium">{item.description}</span>
        <span className="text-muted-foreground truncate text-xs">
          {meta.join(" · ")}
        </span>
      </div>
      <span className="text-sm tabular-nums">
        {ledger.money(item.amountMinor, item.currency)}
      </span>
      <Switch
        aria-label={t("recurring.activeLabel", { name: item.description })}
        checked={item.active}
        onCheckedChange={(active) => {
          toggle.mutate({ id: item.id, json: { active } });
        }}
      />
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              aria-label={t("recurring.moreFor", { name: item.description })}
              size="icon-compact"
              variant="ghost"
            />
          }
        >
          <MoreHorizontal />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => {
              void dialog.open({ dialog: "recurring", id: item.id });
            }}
          >
            <Pencil />
            {tc("actions.edit")}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={async () => {
              const ok = await confirm({
                description: t("recurring.deleteDescription"),
                title: t("recurring.deleteTitle", { name: item.description }),
                tone: "destructive",
              });

              if (ok) {
                remove.mutate(item.id);
              }
            }}
            variant="destructive"
          >
            <Trash2 />
            {tc("actions.delete")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </li>
  );
};

/** Settings › Finances › Recurring income (4.1). */
export const RecurringSettings = () => {
  const { t } = useTranslation("finances");
  const dialog = useFinanceDialog();
  const items = useQuery(recurringQuery);
  const rows = useListMotion();

  let body = <LoadingState rows={2} variant="rows" />;

  if (items.isError) {
    body = (
      <ErrorState
        className="m-3 md:m-3"
        error={items.error}
        onRetry={() => {
          void items.refetch();
        }}
      />
    );
  } else if (items.data !== undefined) {
    body = (
      <ul className="divide-divider divide-y" ref={rows}>
        {items.data.recurring.length === 0 && (
          <li className="text-muted-foreground px-3 py-3 text-sm">
            {t("recurring.empty")}
          </li>
        )}
        {items.data.recurring.map((item) => (
          <Row item={item} key={item.id} />
        ))}
        <li>
          <button
            className="text-primary hover:bg-background flex min-h-12 w-full items-center gap-2 px-3 text-sm font-medium transition-colors md:min-h-10"
            onClick={() => {
              void dialog.open({ dialog: "recurring" });
            }}
            type="button"
          >
            <Plus className="size-4" />
            {t("recurring.add")}
          </button>
        </li>
      </ul>
    );
  }

  return (
    <SettingsSection
      description={t("recurring.description")}
      flush
      title={t("recurring.title")}
    >
      {body}
    </SettingsSection>
  );
};
