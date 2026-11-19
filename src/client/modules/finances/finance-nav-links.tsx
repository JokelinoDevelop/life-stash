import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { todayIso } from "@/lib/partial-date";

import { invoicesQuery } from "./invoices/invoices.queries";

/** The Finances pages under the module in the sidebar; Invoices shows the overdue count. */
export const FinanceNavLinks = ({
  activeClassName,
  className,
}: {
  activeClassName: string;
  className: string;
}) => {
  const { t } = useTranslation("finances");
  const year = Number(todayIso().slice(0, 4));
  const unpaid = useQuery(invoicesQuery({ status: "unpaid", year }));
  const overdue = unpaid.data?.stats.overdueCount ?? 0;

  return (
    <>
      <Link
        activeOptions={{ exact: true, includeSearch: false }}
        activeProps={{ className: activeClassName }}
        className={className}
        to="/finances"
      >
        {t("nav.overview")}
      </Link>
      <Link
        activeProps={{ className: activeClassName }}
        className={className}
        to="/finances/transactions"
      >
        {t("nav.transactions")}
      </Link>
      <Link
        activeProps={{ className: activeClassName }}
        className={className}
        to="/finances/invoices"
      >
        {t("nav.invoices")}
        {overdue > 0 && (
          <span className="text-destructive ml-auto text-xs font-medium tabular-nums">
            {overdue}
          </span>
        )}
      </Link>
      <Link
        activeProps={{ className: activeClassName }}
        className={className}
        to="/finances/clients"
      >
        {t("nav.clients")}
      </Link>
    </>
  );
};
