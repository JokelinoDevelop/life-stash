import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { ReceiptText, SearchX } from "lucide-react";
import { useTranslation } from "react-i18next";

import { EmptyState, ErrorState, LoadingState } from "@/components/app/states";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { FINANCE_SHORTCUTS } from "@/lib/shortcuts";

import { categoriesQuery } from "../categories/categories.queries";
import { useFinanceDialog } from "../dialogs/use-finance-dialog";
import { groupByMonth } from "./group-by-month";
import { MonthBand } from "./month-band";
import { TransactionRow } from "./transaction-row";
import {
  ALL_YEARS,
  filterFromSearch,
  hasActiveFilters,
} from "./transactions-search";
import type { SearchPatch, TransactionsSearch } from "./transactions-search";
import { SearchBox, TransactionsToolbar } from "./transactions-toolbar";
import { transactionsQuery } from "./transactions.queries";

const Footer = ({
  hasMore,
  loading,
  onMore,
  shown,
  total,
  year,
}: {
  hasMore: boolean;
  loading: boolean;
  onMore: () => void;
  shown: number;
  total: number;
  year: number | undefined;
}) => {
  const { t } = useTranslation("finances");

  return (
    <div className="text-muted-foreground flex items-center gap-3 px-0.5 py-3 text-xs tabular-nums md:h-11 md:px-5 md:py-0">
      <span>
        {year === undefined
          ? t("transactions.showing", { shown, total })
          : t("transactions.showingYear", { shown, total, year })}
      </span>
      <span className="flex-1" />
      {hasMore && (
        <Button disabled={loading} onClick={onMore} size="xs" variant="ghost">
          {t("transactions.loadMore")}
        </Button>
      )}
    </div>
  );
};

const Empty = ({
  filtered,
  onClear,
}: {
  filtered: boolean;
  onClear: () => void;
}) => {
  const { t } = useTranslation("finances");
  const dialog = useFinanceDialog();

  if (filtered) {
    return (
      <EmptyState
        action={
          <Button onClick={onClear} size="compact" variant="outline">
            {t("transactions.empty.clear")}
          </Button>
        }
        icon={<SearchX />}
        message={t("transactions.empty.filteredMessage")}
        title={t("transactions.empty.filteredTitle")}
      />
    );
  }

  return (
    <EmptyState
      action={
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
      }
      icon={<ReceiptText />}
      message={t("transactions.empty.message")}
      title={t("transactions.empty.title")}
    />
  );
};

/** The ledger: filters, month groups with totals and "Load more" (1.2, 5.2). */
export const TransactionsView = ({
  currentYear,
  onSearchChange,
  search,
  searchOpen,
}: {
  currentYear: number;
  onSearchChange: (patch: SearchPatch) => void;
  search: TransactionsSearch;
  searchOpen: boolean;
}) => {
  const categories = useQuery(categoriesQuery);

  const list = useInfiniteQuery(
    transactionsQuery(filterFromSearch(search, currentYear))
  );

  const pages = list.data?.pages ?? [];
  const [first] = pages;
  const rows = pages.flatMap((page) => page.transactions);
  const groups = groupByMonth(rows, first?.months ?? []);

  const year =
    search.year === ALL_YEARS ? undefined : (search.year ?? currentYear);

  const clear = () => {
    onSearchChange({
      category: null,
      kind: null,
      q: null,
      year: null,
    });
  };

  let content: React.ReactNode;

  if (list.isPending) {
    content = <LoadingState rows={6} sections={2} />;
  } else if (list.isError) {
    content = (
      <ErrorState
        error={list.error}
        onRetry={() => {
          void list.refetch();
        }}
      />
    );
  } else if (rows.length === 0) {
    content = <Empty filtered={hasActiveFilters(search)} onClear={clear} />;
  } else {
    content = (
      <>
        {groups.map((group) => (
          <section
            className="flex flex-col md:gap-0"
            data-bleed=""
            key={group.month}
          >
            <MonthBand month={group.month} summary={group.summary} />
            <ul className="bg-card divide-divider md:border-divider divide-y overflow-hidden rounded-lg border md:rounded-none md:border-0 md:border-b">
              {group.rows.map((transaction) => (
                <TransactionRow
                  key={transaction.id}
                  transaction={transaction}
                />
              ))}
            </ul>
          </section>
        ))}
        <Footer
          hasMore={list.hasNextPage}
          loading={list.isFetchingNextPage}
          onMore={() => {
            void list.fetchNextPage();
          }}
          shown={rows.length}
          total={first?.total ?? rows.length}
          year={year}
        />
      </>
    );
  }

  return (
    <div className="flex flex-col gap-4 md:gap-0">
      <TransactionsToolbar
        categories={categories.data?.categories ?? []}
        currentYear={currentYear}
        onChange={onSearchChange}
        search={search}
      />
      {searchOpen && (
        <SearchBox
          autoFocus
          className="md:hidden"
          onChange={onSearchChange}
          q={search.q}
        />
      )}
      <div className="flex flex-col gap-5 md:gap-0">{content}</div>
    </div>
  );
};
