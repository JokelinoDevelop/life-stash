import { useInfiniteQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { useSummaryTotals } from "../use-summary-totals";
import { useMonthLabel } from "./month-band";
import { filterFromSearch } from "./transactions-search";
import type { TransactionsSearch } from "./transactions-search";
import { transactionsQuery } from "./transactions.queries";

/** Phone subtitle: the newest month's money in and out ("November · in €980 · out €1,214"). */
export const MonthStatus = ({
  currentYear,
  search,
}: {
  currentYear: number;
  search: TransactionsSearch;
}) => {
  const { t } = useTranslation("finances");
  const summary = useSummaryTotals();
  const label = useMonthLabel();

  const list = useInfiniteQuery(
    transactionsQuery(filterFromSearch(search, currentYear))
  );

  const [month] = list.data?.pages[0]?.months ?? [];

  if (month === undefined) {
    return null;
  }

  return (
    <span className="tabular-nums">
      {t("transactions.monthSummary", {
        expense: summary(month.expense),
        income: summary(month.income),
        month: label(month.month, false),
      })}
    </span>
  );
};
