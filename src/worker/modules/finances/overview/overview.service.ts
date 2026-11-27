import { categoryBreakdown } from "@shared/domain/finances/breakdown";
import type { CategoryShare } from "@shared/domain/finances/breakdown";
import {
  cashflowByBucket,
  cashflowHighlights,
  totalsByBucket,
} from "@shared/domain/finances/cashflow";
import type {
  CashflowHighlights,
  CurrencyCashflow,
} from "@shared/domain/finances/cashflow";
import type { Receivables } from "@shared/domain/finances/invoices";
import {
  bucketKeys,
  pickGranularity,
  previousRange,
} from "@shared/domain/finances/period";
import type { DateRange, Granularity } from "@shared/domain/finances/period";
import { sumByCurrency } from "@shared/domain/money";
import type { MoneyTotal } from "@shared/domain/money";
import type { DatedCost } from "@shared/domain/spending-report";

import type { CategoriesService } from "../categories/categories.service";
import type { ClockPort } from "../household/clock";
import type {
  InvoiceListRow,
  InvoicesService,
} from "../invoices/invoices.service";
import type {
  PendingRecurring,
  RecurringService,
} from "../recurring/recurring.service";
import type {
  TransactionListRow,
  TransactionRow,
  TransactionsRepositoryPort,
} from "../transactions/transactions.repository";
import type { GarageCostsPort } from "./garage-costs";

/** Pseudo category id for Garage's car costs in "Where the money went". */
export const CAR_COSTS = "garage";

/** What the analytics part of the overview covers. Nulls mean "everything". */
export interface OverviewFilter {
  /** Both set, or both null for all time. */
  range: DateRange | null;
  categoryId: string | null;
  clientId: string | null;
}

export interface FinanceOverview {
  today: string;
  /** The range the figures cover: the asked one, or first entry → today for all time. */
  range: DateRange;
  allTime: boolean;
  granularity: Granularity;
  /** Bucket keys of `cashflow` and every category `trend`, oldest first. */
  buckets: string[];
  /** Years that have entries, newest first (for the period picker). */
  years: number[];
  earned: MoneyTotal[];
  spent: MoneyTotal[];
  /** The same-length period just before `range`; null for all time. */
  previous: {
    range: DateRange;
    earned: MoneyTotal[];
    spent: MoneyTotal[];
  } | null;
  receivables: Receivables;
  /** Recurring entries to confirm or skip this month. */
  toConfirm: PendingRecurring[];
  waiting: InvoiceListRow[];
  cashflow: CurrencyCashflow[];
  highlights: CashflowHighlights[];
  categories: (CategoryShare & {
    name: string;
    icon: string | null;
    systemKey: "invoices" | null;
    trend: number[];
  })[];
  recent: TransactionListRow[];
  monthSoFar: { income: MoneyTotal[]; expense: MoneyTotal[] };
  /** False on a first visit (no entries, no invoices): the page shows its empty state. */
  hasData: boolean;
}

const RECENT = 5;
const ALL_TIME_FROM = "0001-01-01";
const ALL_TIME_TO = "9999-12-31";

const within = (date: string, range: DateRange) =>
  date >= range.from && date <= range.to;

/** The first and last of `dates`, or `today` for both when there are none. */
const span = (dates: readonly string[], today: string): DateRange => {
  let from = today;
  let to = today;

  for (const date of dates) {
    from = date < from ? date : from;
    to = date > to ? date : to;
  }

  return { from, to };
};

const totalsFor = (entries: readonly TransactionRow[], range: DateRange) => {
  const earned = sumByCurrency(
    entries.filter((entry) => entry.kind === "income")
  );

  const spent = sumByCurrency(
    entries.filter((entry) => entry.kind === "expense")
  );

  return { earned, range, spent };
};

/** Spending per category (car costs as their own line) with each one's trend per bucket. */
const categoryShares = (
  entries: readonly TransactionRow[],
  carCosts: readonly DatedCost[],
  categories: Awaited<ReturnType<CategoriesService["list"]>>,
  chart: { range: DateRange; buckets: string[]; granularity: Granularity }
): FinanceOverview["categories"] => {
  const byId = new Map(categories.map((category) => [category.id, category]));

  const spending = [
    ...entries.flatMap((entry) =>
      entry.kind === "expense"
        ? [
            {
              amountMinor: entry.amountMinor,
              categoryId: entry.categoryId,
              currency: entry.currency,
              date: entry.date,
            },
          ]
        : []
    ),
    ...carCosts.map((cost) => ({ ...cost, categoryId: CAR_COSTS })),
  ];

  return categoryBreakdown(spending, chart.range).map((share) => {
    const category = byId.get(share.categoryId);

    return {
      ...share,
      icon: category?.icon ?? null,
      name: category?.name ?? "",
      systemKey: category?.systemKey ?? null,
      trend: totalsByBucket(
        spending.filter(
          (entry) =>
            entry.categoryId === share.categoryId &&
            entry.currency === share.currency
        ),
        chart.buckets,
        chart.granularity
      ),
    };
  });
};

/** Everything the Finances overview shows, in one call (`GET /finances/overview`). */
export class OverviewService {
  readonly #transactions: Pick<
    TransactionsRepositoryPort,
    "inRange" | "recent"
  >;
  readonly #invoices: Pick<InvoicesService, "waiting">;
  readonly #categories: Pick<CategoriesService, "list">;
  readonly #garage: GarageCostsPort;
  readonly #recurring: Pick<RecurringService, "pending">;
  readonly #clock: ClockPort;

  constructor(deps: {
    recurring: Pick<RecurringService, "pending">;
    transactions: Pick<TransactionsRepositoryPort, "inRange" | "recent">;
    invoices: Pick<InvoicesService, "waiting">;
    categories: Pick<CategoriesService, "list">;
    garage: GarageCostsPort;
    clock: ClockPort;
  }) {
    this.#transactions = deps.transactions;
    this.#invoices = deps.invoices;
    this.#categories = deps.categories;
    this.#garage = deps.garage;
    this.#recurring = deps.recurring;
    this.#clock = deps.clock;
  }

  async get(filter: OverviewFilter): Promise<FinanceOverview> {
    const [today, all, recent, waiting, categories, garage, pending] =
      await Promise.all([
        this.#clock.today(),
        this.#transactions.inRange(ALL_TIME_FROM, ALL_TIME_TO),
        this.#transactions.recent(RECENT),
        this.#invoices.waiting(),
        this.#categories.list(),
        this.#garage.entries(),
        this.#recurring.pending(),
      ]);

    const filtered = all.filter(
      (entry) =>
        (filter.categoryId === null ||
          entry.categoryId === filter.categoryId) &&
        (filter.clientId === null || entry.clientId === filter.clientId)
    );

    const dates = all.map((entry) => entry.date);

    const range = filter.range ?? span(dates, today);

    const granularity = pickGranularity(range);
    const buckets = bucketKeys(range, granularity);
    const inRange = filtered.filter((entry) => within(entry.date, range));
    const previous = filter.range === null ? null : previousRange(range);

    // Car costs only make sense next to all spending, not a single category or client.
    const carCosts =
      filter.categoryId === null && filter.clientId === null
        ? garage.filter((cost) => within(cost.date, range))
        : [];

    const month = today.slice(0, 7);

    // Averages and best / worst month only count months that have started.
    const elapsed: DateRange = {
      from: range.from,
      to: range.to < today ? range.to : today,
    };

    // oxlint-disable-next-line sonarjs/shorthand-property-grouping -- conflicts with sort-keys
    return {
      allTime: filter.range === null,
      buckets,
      cashflow: cashflowByBucket(inRange, range, granularity),
      categories: categoryShares(inRange, carCosts, categories, {
        buckets,
        granularity,
        range,
      }),
      earned: sumByCurrency(inRange.filter((entry) => entry.kind === "income")),
      granularity,
      hasData: all.length > 0 || recent.length > 0 || waiting.rows.length > 0,
      highlights: cashflowHighlights(
        cashflowByBucket(inRange, elapsed, "month")
      ),
      monthSoFar: {
        expense: sumByCurrency(
          filtered.filter(
            (entry) => entry.kind === "expense" && entry.date.startsWith(month)
          )
        ),
        income: sumByCurrency(
          filtered.filter(
            (entry) => entry.kind === "income" && entry.date.startsWith(month)
          )
        ),
      },
      previous:
        previous === null
          ? null
          : totalsFor(
              filtered.filter((entry) => within(entry.date, previous)),
              previous
            ),
      range,
      receivables: waiting.receivables,
      recent,
      spent: sumByCurrency(inRange.filter((entry) => entry.kind === "expense")),
      toConfirm: pending,
      today,
      waiting: waiting.rows,
      years: [
        ...new Set(dates.map((date) => Number(date.slice(0, 4)))),
      ].toSorted((a, b) => b - a),
    };
  }
}
