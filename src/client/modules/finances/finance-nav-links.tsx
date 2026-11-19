import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

/** The Finances pages under the module in the sidebar. More pages arrive with invoices. */
export const FinanceNavLinks = ({
  activeClassName,
  className,
}: {
  activeClassName: string;
  className: string;
}) => {
  const { t } = useTranslation("finances");

  return (
    <Link
      activeProps={{ className: activeClassName }}
      className={className}
      to="/finances/transactions"
    >
      {t("nav.transactions")}
    </Link>
  );
};
