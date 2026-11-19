import { categoryBreakdown } from "@shared/domain/finances/breakdown";
import type { CategoryShare } from "@shared/domain/finances/breakdown";
import { monthlyCashflow } from "@shared/domain/finances/cashflow";
import type { CurrencyCashflow } from "@shared/domain/finances/cashflow";
import type { Receivables } from "@shared/domain/finances/invoices";
import { sumByCurrency } from "@shared/domain/money";
import type { MoneyTotal } from "@shared/domain/money";

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
  TransactionsRepositoryPort,
} from "../transactions/transactions.repository";
import type { GarageCostsPort } from "./garage-costs";

/** Pseudo category id for Garage's car costs in "Where the money went". */
export const CAR_COSTS = "garage";

export interface FinanceOverview {
  year: number;
  today: string;
  earned: MoneyTotal[];
  earnedLastYear: MoneyTotal[];
  spent: MoneyTotal[];
  /** Months of `year` counted for the monthly average (12 for past years). */
  monthsElapsed: number;
  receivables: Receivables;
  /** Recurring entries to confirm or skip this month (current year only). */
  toConfirm: PendingRecurring[];
  waiting: InvoiceListRow[];
  cashflow: CurrencyCashflow[];
  categories: (CategoryShare & {
    name: string;
    icon: string | null;
    systemKey: "invoices" | null;
  })[];
  carCosts: MoneyTotal[];
  recent: TransactionListRow[];
  monthSoFar: { income: MoneyTotal[]; expense: MoneyTotal[] };
  /** False on a first visit (no entries, no invoices): the page shows its empty state. */
  hasData: boolean;
}

const RECENT = 5;
const MONTHS = 12;

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

  async get(year: number): Promise<FinanceOverview> {
    const [today, entries, recent, waiting, categories, carCosts, pending] =
      await Promise.all([
        this.#clock.today(),
        this.#transactions.inRange(`${year - 1}-01-01`, `${year}-12-31`),
        this.#transactions.recent(RECENT),
        this.#invoices.waiting(),
        this.#categories.list(),
        this.#garage.forYear(year),
        this.#recurring.pending(),
      ]);

    const thisYear = entries.filter((entry) =>
      entry.date.startsWith(`${year}-`)
    );

    const lastYear = entries.filter((entry) =>
      entry.date.startsWith(`${year - 1}-`)
    );

    const expenses = thisYear.filter((entry) => entry.kind === "expense");
    const month = today.slice(0, 7);
    const currentYear = Number(today.slice(0, 4));
    const byId = new Map(categories.map((category) => [category.id, category]));

    const shares = categoryBreakdown(
      [
        ...expenses,
        ...carCosts.map((total) => ({
          ...total,
          categoryId: CAR_COSTS,
          date: `${year}-01-01`,
        })),
      ],
      { from: `${year}-01-01`, to: `${year}-12-31` }
    );

    // oxlint-disable-next-line sonarjs/shorthand-property-grouping -- conflicts with sort-keys
    return {
      carCosts,
      cashflow: monthlyCashflow(thisYear, year),
      categories: shares.map((share) => {
        const category = byId.get(share.categoryId);

        return {
          ...share,
          icon: category?.icon ?? null,
          name: category?.name ?? "",
          systemKey: category?.systemKey ?? null,
        };
      }),
      earned: sumByCurrency(
        thisYear.filter((entry) => entry.kind === "income")
      ),
      earnedLastYear: sumByCurrency(
        lastYear.filter((entry) => entry.kind === "income")
      ),
      hasData:
        entries.length > 0 || recent.length > 0 || waiting.rows.length > 0,
      monthSoFar: {
        expense: sumByCurrency(
          thisYear.filter(
            (entry) => entry.kind === "expense" && entry.date.startsWith(month)
          )
        ),
        income: sumByCurrency(
          thisYear.filter(
            (entry) => entry.kind === "income" && entry.date.startsWith(month)
          )
        ),
      },
      monthsElapsed: year === currentYear ? Number(today.slice(5, 7)) : MONTHS,
      receivables: waiting.receivables,
      recent,
      spent: sumByCurrency(expenses),
      toConfirm: year === currentYear ? pending : [],
      today,
      waiting: waiting.rows,
      year,
    };
  }
}
