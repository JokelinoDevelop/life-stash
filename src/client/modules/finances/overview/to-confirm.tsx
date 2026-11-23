import { addDays, formatShortDate } from "@shared/domain/dates";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";

import { CategoryIcon } from "../categories/category-icon";
import { useLedgerMoney } from "../money";
import {
  useConfirmRecurring,
  useSkipRecurring,
} from "../recurring/recurring.queries";
import { useMonthLabel } from "../transactions/month-band";
import { OverviewSection } from "./overview-section";
import type { FinanceOverview } from "./overview.queries";

type Pending = FinanceOverview["toConfirm"][number];

/** "To confirm": this month's recurring income, with Skip and Confirm (desktop band, phone card). */
export const ToConfirm = ({ overview }: { overview: FinanceOverview }) => {
  const { t } = useTranslation("finances");
  const ledger = useLedgerMoney();
  const month = useMonthLabel();
  const confirm = useConfirmRecurring();
  const skip = useSkipRecurring();

  if (overview.toConfirm.length === 0) {
    return null;
  }

  const title = (item: Pending) =>
    t("recurring.monthItem", {
      month: month(item.dueDate.slice(0, 7), false),
      name: item.description,
    });

  const meta = (item: Pending) =>
    [
      item.clientName,
      t("recurring.usuallyOn", { count: item.dayOfMonth, ordinal: true }),
    ]
      .filter((part) => part !== null)
      .join(" · ");

  const busy = confirm.isPending || skip.isPending;

  return (
    <OverviewSection
      action={
        <span className="text-muted-foreground text-xs">
          {t("recurring.toConfirmHint")}
        </span>
      }
      animated
      count={overview.toConfirm.length}
      title={t("recurring.toConfirm")}
    >
      {overview.toConfirm.map((item) => (
        <li
          className="bg-card flex min-h-14 items-center gap-3 px-3.5 md:min-h-11 md:px-5"
          key={item.id}
        >
          <CategoryIcon name={item.categoryIcon} />
          <div className="flex min-w-0 flex-1 flex-col md:flex-row md:items-baseline md:gap-2">
            <span className="truncate font-medium">{title(item)}</span>
            <span className="text-muted-foreground truncate text-xs md:text-sm">
              {meta(item)}
              <span className="md:hidden">
                {" · "}
                {ledger.money(item.amountMinor, item.currency)}
              </span>
            </span>
          </div>
          <span className="text-muted-foreground hidden tabular-nums md:block">
            {item.dueDate === addDays(overview.today, 0)
              ? t("overview.dueToday")
              : formatShortDate(item.dueDate)}
          </span>
          <span className="hidden w-28 text-right font-medium tabular-nums md:block">
            {ledger.money(item.amountMinor, item.currency)}
          </span>
          <span className="flex shrink-0 gap-1">
            <Button
              className="hidden md:inline-flex"
              disabled={busy}
              onClick={() => {
                skip.mutate(item);
              }}
              size="xs"
              variant="ghost"
            >
              {t("recurring.skip")}
            </Button>
            <Button
              disabled={busy}
              onClick={() => {
                confirm.mutate(item);
              }}
              size="xs"
              variant="outline"
            >
              {t("recurring.confirm")}
            </Button>
          </span>
        </li>
      ))}
    </OverviewSection>
  );
};
