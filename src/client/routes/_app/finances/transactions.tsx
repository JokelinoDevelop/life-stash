import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Plus, Search } from "lucide-react";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";

import { BackLink } from "@/components/app/back-link";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { useHotkey } from "@/hooks/use-hotkey";
import { todayIso } from "@/lib/partial-date";
import { FINANCE_SHORTCUTS } from "@/lib/shortcuts";
import { cached, warm } from "@/lib/warm";
import { categoriesQuery } from "@/modules/finances/categories/categories.queries";
import { clientsQuery } from "@/modules/finances/clients/clients.queries";
import { useFinanceDialog } from "@/modules/finances/dialogs/use-finance-dialog";
import { MonthStatus } from "@/modules/finances/transactions/month-status";
import {
  applySearchPatch,
  transactionsSearchSchema,
  filterFromSearch,
} from "@/modules/finances/transactions/transactions-search";
import type { SearchPatch } from "@/modules/finances/transactions/transactions-search";
import { TransactionsView } from "@/modules/finances/transactions/transactions-view";
import { transactionsQuery } from "@/modules/finances/transactions/transactions.queries";

const TransactionsPage = () => {
  const { t } = useTranslation("finances");
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const dialog = useFinanceDialog();
  const [searchOpen, setSearchOpen] = useState(search.q !== undefined);
  const currentYear = Number(todayIso().slice(0, 4));

  const logTransaction = () => {
    void dialog.open({ dialog: "transaction" });
  };

  useHotkey(FINANCE_SHORTCUTS.logTransaction, logTransaction);

  const onSearchChange = useCallback(
    (patch: SearchPatch) => {
      void navigate({
        replace: true,
        // Turning (or, on phones, growing) the list keeps your place.
        resetScroll: patch.page === undefined,
        search: (prev) => applySearchPatch(prev, patch),
      });
    },
    [navigate]
  );

  return (
    <>
      <PageHeader
        actions={
          <>
            <Button
              aria-label={t("transactions.search")}
              className="md:hidden"
              onClick={() => {
                setSearchOpen((open) => !open);
              }}
              size="icon-compact"
              variant="ghost"
            >
              <Search />
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
            <Button
              className="hidden md:inline-flex"
              onClick={logTransaction}
              size="compact"
            >
              <Plus />
              {t("transactions.log")}
              <Kbd>{FINANCE_SHORTCUTS.logTransaction.toUpperCase()}</Kbd>
            </Button>
          </>
        }
        back={<BackLink label={t("title")} to="/finances" />}
        description={<MonthStatus currentYear={currentYear} search={search} />}
        title={t("transactions.title")}
      />
      <TransactionsView
        currentYear={currentYear}
        onSearchChange={onSearchChange}
        search={search}
        searchOpen={searchOpen}
      />
    </>
  );
};

export const Route = createFileRoute("/_app/finances/transactions")({
  validateSearch: transactionsSearchSchema,
  loaderDeps: ({ search }) => search,
  loader: async ({ context: { queryClient }, deps }) => {
    const year = Number(todayIso().slice(0, 4));

    await warm(
      queryClient.query(cached(categoriesQuery)),
      queryClient.query(cached(clientsQuery(year))),
      queryClient.infiniteQuery(
        cached(transactionsQuery(filterFromSearch(deps, year)))
      )
    );
  },
  component: TransactionsPage,
});
