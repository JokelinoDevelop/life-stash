import { addDays, formatShortDate } from "@shared/domain/dates";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { todayIso } from "@/lib/partial-date";
import { cn } from "@/lib/utils";

import { CategoryIcon } from "../categories/category-icon";
import { useCategoryName } from "../categories/category-label";
import { FinanceDialogLink } from "../dialogs/finance-dialog-link";
import { useLedgerMoney } from "../money";
import { OverviewSection } from "./overview-section";
import type { FinanceOverview } from "./overview.queries";

const useRelativeDate = () => {
  const { t } = useTranslation();

  return (date: string): string => {
    const today = todayIso();

    if (date === today) {
      return t("date.today");
    }

    return date === addDays(today, -1)
      ? t("date.yesterday")
      : formatShortDate(date);
  };
};

/** The five newest entries. */
export const RecentList = ({ overview }: { overview: FinanceOverview }) => {
  const { t } = useTranslation("finances");
  const ledger = useLedgerMoney();
  const nameOf = useCategoryName();
  const relative = useRelativeDate();

  if (overview.recent.length === 0) {
    return null;
  }

  return (
    <OverviewSection
      action={
        <Link
          className="text-primary text-xs font-medium"
          to="/finances/transactions"
        >
          {t("overview.allTransactions")}
        </Link>
      }
      title={t("overview.recent")}
    >
      {overview.recent.map((row) => {
        const income = row.kind === "income";

        const meta = [
          nameOf(row.category),
          row.clientName,
          relative(row.date),
        ].filter((part) => part !== null);

        return (
          <li
            className="hover:bg-background max-md:active:bg-accent bg-card relative grid min-h-13 grid-cols-[24px_minmax(0,1fr)_auto] items-center gap-3 px-3.5 md:min-h-10 md:grid-cols-[24px_minmax(140px,1fr)_160px_150px_64px_104px] md:px-5"
            key={row.id}
          >
            <CategoryIcon name={row.category.icon} />
            <div className="flex min-w-0 flex-col">
              <FinanceDialogLink
                className="truncate font-medium outline-none after:absolute after:inset-0 focus-visible:underline"
                entry={{ dialog: "transaction", id: row.id }}
              >
                {row.description}
              </FinanceDialogLink>
              <span className="text-muted-foreground truncate text-xs md:hidden">
                {meta.join(" · ")}
              </span>
            </div>
            <span className="text-subtle-foreground hidden truncate md:block">
              {nameOf(row.category)}
            </span>
            <span className="text-muted-foreground hidden truncate md:block">
              {row.clientName ?? "—"}
            </span>
            <span className="text-muted-foreground hidden tabular-nums md:block">
              {relative(row.date)}
            </span>
            <span
              className={cn(
                "text-right tabular-nums",
                income && "text-success-foreground font-medium"
              )}
            >
              {ledger.signed(row.amountMinor, row.currency, row.kind)}
            </span>
          </li>
        );
      })}
    </OverviewSection>
  );
};
