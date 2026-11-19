import { useQuery } from "@tanstack/react-query";
import { Wallet } from "lucide-react";
import { useTranslation } from "react-i18next";

import { EmptyState, ErrorState, LoadingState } from "@/components/app/states";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { useFormat } from "@/lib/format";
import { FINANCE_SHORTCUTS } from "@/lib/shortcuts";

import { useFinanceDialog } from "../dialogs/use-finance-dialog";
import { CashflowPanel } from "./cashflow-panel";
import { OverviewKpis } from "./overview-kpis";
import { OverviewMobileTop } from "./overview-mobile";
import { overviewQuery } from "./overview.queries";
import { RecentList } from "./recent-list";
import { ToConfirm } from "./to-confirm";
import { WaitingList } from "./waiting-list";
import { WhereMoneyWent } from "./where-money-went";

const FirstVisit = () => {
  const { t } = useTranslation("finances");
  const dialog = useFinanceDialog();

  return (
    <EmptyState
      action={
        <span className="flex gap-2">
          <Button
            onClick={() => {
              void dialog.open({ dialog: "client" });
            }}
            size="compact"
            variant="outline"
          >
            {t("overview.empty.addClient")}
          </Button>
          <Button
            onClick={() => {
              void dialog.open({ dialog: "transaction" });
            }}
            size="compact"
          >
            {t("transactions.log")}
            <Kbd className="hidden md:inline-flex">
              {FINANCE_SHORTCUTS.logTransaction.toUpperCase()}
            </Kbd>
          </Button>
        </span>
      }
      icon={<Wallet />}
      message={t("overview.empty.message")}
      title={t("overview.empty.title")}
    />
  );
};

/** Finances overview (1.1, 5.1): one request for the whole page. */
export const OverviewView = ({ year }: { year: number }) => {
  const format = useFormat();
  const overview = useQuery(overviewQuery(year));

  if (overview.isPending) {
    return <LoadingState rows={4} sections={2} />;
  }

  if (overview.isError) {
    return (
      <ErrorState
        error={overview.error}
        onRetry={() => {
          void overview.refetch();
        }}
      />
    );
  }

  const { data } = overview;

  if (!data.hasData) {
    return <FirstVisit />;
  }

  const chartCurrency =
    data.cashflow.find((series) => series.currency === format.currency)
      ?.currency ??
    data.cashflow[0]?.currency ??
    format.currency;

  return (
    <div className="flex flex-col gap-6 md:gap-0">
      <OverviewMobileTop overview={data} />
      <div className="hidden md:block" data-bleed="">
        <OverviewKpis overview={data} />
      </div>
      <ToConfirm overview={data} />
      <WaitingList overview={data} />
      <div className="hidden gap-4 md:mx-5 md:my-4 md:grid md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="hidden md:block">
          <CashflowPanel overview={data} />
        </div>
        <div className="hidden md:block">
          <WhereMoneyWent currency={chartCurrency} overview={data} />
        </div>
      </div>
      <RecentList overview={data} />
    </div>
  );
};
