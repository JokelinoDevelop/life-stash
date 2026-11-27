import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";

import { HouseholdName } from "@/components/app/household-name";
import { LOADING_LAYOUTS } from "@/components/app/loading-layouts";
import { PageHeader } from "@/components/app/page-header";
import { PageSkeleton } from "@/components/app/page-skeleton";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { useHotkey } from "@/hooks/use-hotkey";
import { todayIso } from "@/lib/partial-date";
import { FINANCE_SHORTCUTS } from "@/lib/shortcuts";
import { cached, warm } from "@/lib/warm";
import { useFinanceDialog } from "@/modules/finances/dialogs/use-finance-dialog";
import {
  applyOverviewPatch,
  filterOf,
  overviewSearchSchema,
} from "@/modules/finances/overview/overview-search";
import type { OverviewPatch } from "@/modules/finances/overview/overview-search";
import { OverviewView } from "@/modules/finances/overview/overview-view";
import { overviewQuery } from "@/modules/finances/overview/overview.queries";
import { financeSettingsQuery } from "@/modules/finances/settings/finance-settings.queries";
import { useSummaryTotals } from "@/modules/finances/use-summary-totals";

const FinancesPage = () => {
  const { t } = useTranslation("finances");
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const dialog = useFinanceDialog();
  const overview = useQuery(overviewQuery(filterOf(search, todayIso())));
  const receivables = overview.data?.receivables;

  const logTransaction = () => {
    void dialog.open({ dialog: "transaction" });
  };

  const newInvoice = () => {
    void dialog.open({ dialog: "invoice" });
  };

  const onSearchChange = useCallback(
    (patch: OverviewPatch) => {
      void navigate({
        replace: true,
        search: (prev) => applyOverviewPatch(prev, patch),
      });
    },
    [navigate]
  );

  useHotkey(FINANCE_SHORTCUTS.logTransaction, logTransaction);
  useHotkey(FINANCE_SHORTCUTS.newInvoice, newInvoice);

  const summary = useSummaryTotals();
  let status: string | undefined;

  if (receivables !== undefined) {
    if (receivables.unpaidCount === 0) {
      status = t("overview.statusClear");
    } else if (receivables.overdueCount > 0) {
      status = t("overview.status", {
        amount: summary(receivables.unpaid),
        count: receivables.overdueCount,
      });
    } else {
      status = t("overview.statusNoOverdue", {
        amount: summary(receivables.unpaid),
      });
    }
  }

  return (
    <>
      <PageHeader
        actions={
          <>
            <Button
              className="hidden md:inline-flex"
              onClick={newInvoice}
              size="compact"
              variant="outline"
            >
              {t("overview.newInvoice")}
            </Button>
            <Button
              className="hidden md:inline-flex"
              onClick={logTransaction}
              size="compact"
            >
              <Plus />
              {t("transactions.log")}
              <Kbd>{FINANCE_SHORTCUTS.logTransaction.toUpperCase()}</Kbd>
            </Button>
            <Button
              aria-label={t("transactions.log")}
              className="md:hidden"
              onClick={logTransaction}
              size="icon-compact"
              variant="ghost"
            >
              <Plus />
            </Button>
          </>
        }
        description={status}
        mobileTop={<HouseholdName className="-ml-1" />}
        title={t("title")}
      />
      <OverviewView onSearchChange={onSearchChange} search={search} />
    </>
  );
};

export const Route = createFileRoute("/_app/finances/")({
  validateSearch: overviewSearchSchema,
  loaderDeps: ({ search }) => search,
  loader: async ({ context: { queryClient }, deps }) => {
    await warm(
      queryClient.query(cached(overviewQuery(filterOf(deps, todayIso())))),
      queryClient.query(cached(financeSettingsQuery))
    );
  },
  pendingComponent: () => <PageSkeleton {...LOADING_LAYOUTS.finances} />,
  component: FinancesPage,
});
