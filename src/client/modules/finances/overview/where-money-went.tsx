import type { Currency } from "@shared/domain/money";
import { Link } from "@tanstack/react-router";
import { ArrowUpRight, CarFront } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Panel } from "@/components/app/list-section";
import { useFormat } from "@/lib/format";

import { CategoryIcon } from "../categories/category-icon";
import { useCategoryName } from "../categories/category-label";
import type { FinanceOverview } from "./overview.queries";

const TOP = 6;

/** Top spending categories of the year with their share, Car costs from Garage included. */
export const WhereMoneyWent = ({
  currency,
  overview,
}: {
  currency: Currency;
  overview: FinanceOverview;
}) => {
  const { t } = useTranslation("finances");
  const format = useFormat();
  const nameOf = useCategoryName();

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
          search={{ kind: "expense" }}
          to="/finances/transactions"
        >
          {t("overview.allSpending")}
        </Link>
      }
      title={t("overview.whereMoneyWent")}
    >
      {shares.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          {t("overview.noSpending", { year: overview.year })}
        </p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {top.map((share) => {
            const car = share.categoryId === null;

            return (
              <li
                className="grid grid-cols-[minmax(0,9rem)_minmax(0,1fr)_auto_2.5rem] items-center gap-3 text-sm"
                key={share.categoryId ?? "garage"}
              >
                <span className="flex min-w-0 items-center gap-2">
                  {car ? (
                    <CarFront
                      aria-hidden="true"
                      className="text-muted-foreground size-3.5 shrink-0"
                    />
                  ) : (
                    <CategoryIcon bare name={share.icon} />
                  )}
                  {car ? (
                    <Link
                      className="hover:text-primary flex min-w-0 items-center gap-1 truncate"
                      to="/garage"
                    >
                      {t("overview.carCosts")}
                      <ArrowUpRight
                        aria-hidden="true"
                        className="size-3 shrink-0"
                      />
                      <span className="sr-only">
                        {t("overview.openGarage")}
                      </span>
                    </Link>
                  ) : (
                    <span className="truncate">{nameOf(share)}</span>
                  )}
                </span>
                <span className="bg-muted h-1.5 overflow-hidden rounded-full">
                  <span
                    className="bg-chart-1 block h-full w-(--share) rounded-full"
                    style={{ "--share": `${share.sharePercent}%` }}
                  />
                </span>
                <span className="tabular-nums">
                  {format.money(share.amountMinor, share.currency)}
                </span>
                <span className="text-muted-foreground text-right tabular-nums">
                  {Math.round(share.sharePercent)}%
                </span>
              </li>
            );
          })}
          {rest.length > 0 && (
            <li className="text-muted-foreground grid grid-cols-[minmax(0,9rem)_minmax(0,1fr)_auto_2.5rem] items-center gap-3 text-sm">
              <span className="pl-5.5">
                {t("overview.more", { count: rest.length })}
              </span>
              <span className="bg-muted h-1.5 overflow-hidden rounded-full">
                <span
                  className="bg-chart-4 block h-full w-(--share) rounded-full"
                  style={{ "--share": `${restShare}%` }}
                />
              </span>
              <span className="text-foreground tabular-nums">
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
