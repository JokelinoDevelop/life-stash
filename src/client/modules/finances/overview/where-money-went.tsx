import type { Currency } from "@shared/domain/money";
import { Link } from "@tanstack/react-router";
import { ArrowUpRight, CarFront } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Panel } from "@/components/app/list-section";
import { useFormat } from "@/lib/format";
import { cn } from "@/lib/utils";

import { CategoryIcon } from "../categories/category-icon";
import { useCategoryName } from "../categories/category-label";
import type { TransactionsSearch } from "../transactions/transactions-search";
import { transactionsSearchFor } from "./overview-search";
import type { OverviewSearch } from "./overview-search";
import type { FinanceOverview } from "./overview.queries";
import { Sparkline } from "./sparkline";

const TOP = 6;

/** A trend needs a few points to say anything. */
const MIN_TREND_POINTS = 3;

/** Name · share bar (desktop; the trend line instead when there is one) · amount · share. Phones skip the bar. */
const ROW =
  "grid grid-cols-[minmax(0,1fr)_auto_2.5rem] items-center gap-3 text-sm md:grid-cols-[minmax(0,9rem)_minmax(0,1fr)_7rem_2.5rem]";

type Share = FinanceOverview["categories"][number];

/** Icon and name; a category opens its transactions, Car costs open Garage. */
const ShareName = ({ share, to }: { share: Share; to: TransactionsSearch }) => {
  const { t } = useTranslation("finances");
  const nameOf = useCategoryName();

  if (share.categoryId === null) {
    return (
      <span className="flex min-w-0 items-center gap-2">
        <CarFront
          aria-hidden="true"
          className="text-muted-foreground size-3.5 shrink-0"
        />
        <Link
          className="hover:text-primary flex min-w-0 items-center gap-1 truncate"
          to="/garage"
        >
          {t("overview.carCosts")}
          <ArrowUpRight aria-hidden="true" className="size-3 shrink-0" />
          <span className="sr-only">{t("overview.openGarage")}</span>
        </Link>
      </span>
    );
  }

  return (
    <span className="flex min-w-0 items-center gap-2">
      <CategoryIcon bare name={share.icon} />
      <Link
        className="hover:text-primary truncate"
        search={to}
        to="/finances/transactions"
      >
        {nameOf(share)}
      </Link>
    </span>
  );
};

/**
 * Top spending categories of the period with their share and trend, Car costs from Garage
 * included. A category opens its transactions for the same period.
 */
export const WhereMoneyWent = ({
  currency,
  overview,
  search,
}: {
  currency: Currency;
  overview: FinanceOverview;
  search: OverviewSearch;
}) => {
  const { t } = useTranslation("finances");
  const format = useFormat();
  const nameOf = useCategoryName();
  const period = overview.allTime ? null : overview.range;
  const trends = overview.buckets.length >= MIN_TREND_POINTS;

  const shares = overview.categories.filter(
    (share) => share.currency === currency
  );

  const top = shares.slice(0, TOP);
  const rest = shares.slice(TOP);
  const restAmount = rest.reduce((sum, share) => sum + share.amountMinor, 0);

  const restShare = Math.round(
    rest.reduce((sum, share) => sum + share.sharePercent, 0)
  );

  return (
    <Panel
      action={
        <Link
          className="text-primary text-xs font-medium"
          search={transactionsSearchFor(search, period, { kind: "expense" })}
          to="/finances/transactions"
        >
          {t("overview.allSpending")}
        </Link>
      }
      title={t("overview.whereMoneyWent")}
    >
      {shares.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          {t("overview.noSpending")}
        </p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {top.map((share) => {
            const car = share.categoryId === null;

            return (
              <li className={ROW} key={share.categoryId ?? "garage"}>
                <ShareName
                  share={share}
                  to={transactionsSearchFor(search, period, {
                    category: share.categoryId ?? undefined,
                    kind: "expense",
                  })}
                />
                <span
                  className={cn(
                    "bg-muted hidden h-1.5 overflow-hidden rounded-full md:block",
                    trends && "md:hidden"
                  )}
                >
                  <span
                    className="bg-chart-1 block h-full w-(--share) rounded-full"
                    style={{ "--share": `${share.sharePercent}%` }}
                  />
                </span>
                {trends && (
                  <span className="hidden md:block">
                    <Sparkline
                      className="h-4 w-full"
                      label={t("overview.trendOf", {
                        name: car ? t("overview.carCosts") : nameOf(share),
                      })}
                      values={share.trend}
                    />
                  </span>
                )}
                <span className="tabular-nums md:text-right">
                  {format.money(share.amountMinor, share.currency)}
                </span>
                <span className="text-muted-foreground text-right tabular-nums">
                  {Math.round(share.sharePercent)}%
                </span>
              </li>
            );
          })}
          {rest.length > 0 && (
            <li className={cn(ROW, "text-muted-foreground")}>
              <span className="pl-5.5">
                {t("overview.more", { count: rest.length })}
              </span>
              <span
                className={cn(
                  "bg-muted hidden h-1.5 overflow-hidden rounded-full md:block",
                  trends && "md:hidden"
                )}
              >
                <span
                  className="bg-chart-4 block h-full w-(--share) rounded-full"
                  style={{ "--share": `${restShare}%` }}
                />
              </span>
              {trends && <span className="hidden md:block" />}
              <span className="text-foreground tabular-nums md:text-right">
                {format.money(restAmount, currency)}
              </span>
              <span className="text-right tabular-nums">{restShare}%</span>
            </li>
          )}
        </ul>
      )}
      <p className="text-muted-foreground mt-3 text-xs">
        {t("overview.carCostsNote")}
      </p>
    </Panel>
  );
};
