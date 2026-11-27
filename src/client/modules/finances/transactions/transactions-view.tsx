import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import type {
  InfiniteData,
  UseInfiniteQueryResult,
} from "@tanstack/react-query";
import { ReceiptText, SearchX } from "lucide-react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

import { PagedList, useGrowingList } from "@/components/app/list-pagination";
import { ListRows } from "@/components/app/list-section";
import { EmptyState, ErrorState, LoadingState } from "@/components/app/states";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { FINANCE_SHORTCUTS } from "@/lib/shortcuts";

import { categoriesQuery } from "../categories/categories.queries";
import { clientsQuery } from "../clients/clients.queries";
import { useFinanceDialog } from "../dialogs/use-finance-dialog";
import { groupByMonth } from "./group-by-month";
import { MonthBand } from "./month-band";
import { TransactionRow } from "./transaction-row";
import { filterFromSearch, hasActiveFilters } from "./transactions-search";
import type { SearchPatch, TransactionsSearch } from "./transactions-search";
import { SearchBox, TransactionsToolbar } from "./transactions-toolbar";
import {
  TRANSACTIONS_PAGE_SIZE,
  transactionsQuery,
} from "./transactions.queries";
import type { TransactionPage } from "./transactions.queries";

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

/** The rows on screen: one page on desktop; every loaded page so far on phones. */
const shownRows = (
  pages: readonly TransactionPage[],
  current: number,
  growing: boolean
) =>
  growing
    ? pages
        .slice(0, Math.min(current, pages.length))
        .flatMap((loadedPage) => loadedPage.transactions)
    : (pages[current - 1]?.transactions ?? []);

/** The pager's numbers; a growing list (phones) always starts at the first row. */
const sliceOf = ({
  current,
  growing,
  pageCount,
  shown,
  total,
}: {
  current: number;
  growing: boolean;
  pageCount: number;
  shown: number;
  total: number;
}) => {
  const start = growing ? 1 : (current - 1) * TRANSACTIONS_PAGE_SIZE + 1;

  return { end: start + shown - 1, page: current, pageCount, start, total };
};

/** Loading, error, empty, or one page of month groups with the pager. */
const LedgerContent = ({
  list,
  onClear,
  onPageChange,
  page,
  search,
}: {
  list: UseInfiniteQueryResult<InfiniteData<TransactionPage>>;
  onClear: () => void;
  onPageChange: (page: number) => void;
  page: number;
  search: TransactionsSearch;
}) => {
  const pages = list.data?.pages ?? [];
  const [first] = pages;
  const total = first?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / TRANSACTIONS_PAGE_SIZE));
  const current = Math.min(Math.max(1, page), pageCount);
  const { fetchNextPage, hasNextPage, isFetchingNextPage } = list;
  const growing = useGrowingList();
  const waiting = current > pages.length;

  // Pages load on demand: a deep link or "Older" fetches up to the one shown.
  useEffect(() => {
    if (current > pages.length && hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  }, [current, fetchNextPage, hasNextPage, isFetchingNextPage, pages.length]);

  // Phones keep the loaded rows on screen while the next page arrives below them.
  if (list.isPending || (waiting && !growing)) {
    return <LoadingState rows={6} sections={2} />;
  }

  if (list.isError) {
    return (
      <ErrorState
        error={list.error}
        onRetry={() => {
          void list.refetch();
        }}
      />
    );
  }

  const rows = shownRows(pages, current, growing);

  if (rows.length === 0) {
    return <Empty filtered={hasActiveFilters(search)} onClear={onClear} />;
  }

  return (
    <PagedList
      loading={isFetchingNextPage || waiting}
      onPageChange={onPageChange}
      // oxlint-disable-next-line sonarjs/shorthand-property-grouping -- conflicts with sort-keys
      slice={sliceOf({
        current: growing ? Math.min(current, pages.length) : current,
        growing,
        pageCount,
        shown: rows.length,
        total,
      })}
    >
      {groupByMonth(rows, first?.months ?? []).map((group) => (
        <section
          className="flex flex-col md:gap-0"
          data-bleed=""
          key={group.month}
        >
          <MonthBand month={group.month} summary={group.summary} />
          <ListRows>
            {group.rows.map((transaction) => (
              <TransactionRow key={transaction.id} transaction={transaction} />
            ))}
          </ListRows>
        </section>
      ))}
    </PagedList>
  );
};

/** Transactions: filters, month groups with totals, and the pager (1.2, 5.2). */
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
  const clients = useQuery(clientsQuery(currentYear));

  const list = useInfiniteQuery(
    transactionsQuery(filterFromSearch(search, currentYear))
  );

  const clear = () => {
    onSearchChange({
      category: null,
      client: null,
      from: null,
      kind: null,
      q: null,
      to: null,
      year: null,
    });
  };

  return (
    <div className="flex flex-col gap-4 md:gap-0">
      <TransactionsToolbar
        categories={categories.data?.categories ?? []}
        clients={clients.data?.clients ?? []}
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
      <div className="flex flex-col gap-5 md:gap-0">
        <LedgerContent
          list={list}
          onClear={clear}
          onPageChange={(page) => {
            onSearchChange({ page: page <= 1 ? null : page });
          }}
          page={search.page ?? 1}
          search={search}
        />
      </div>
    </div>
  );
};
