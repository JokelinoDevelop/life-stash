import type {
  CashflowHighlights,
  CurrencyCashflow,
} from "@shared/domain/finances/cashflow";
import type { InvoiceStatus } from "@shared/domain/finances/invoices";
import type { TransactionKind } from "@shared/domain/finances/kinds";
import type { Granularity } from "@shared/domain/finances/period";
import type { Currency, MoneyTotal } from "@shared/domain/money";

import type { FinanceOverview } from "../overview.service";
import { CAR_COSTS } from "../overview.service";

export interface FinanceOverviewResponse {
  today: string;
  hasData: boolean;
  /** What the figures cover; for all time, first entry → today (or the last future entry). */
  range: { from: string; to: string };
  allTime: boolean;
  granularity: Granularity;
  /** Keys of the cashflow buckets and category trends: `2026-03`, `2026-Q1` or `2026`. */
  buckets: string[];
  /** Years with entries, newest first. */
  years: number[];
  earned: MoneyTotal[];
  spent: MoneyTotal[];
  /** The same-length period before `range`; null for all time. */
  previous: {
    range: { from: string; to: string };
    earned: MoneyTotal[];
    spent: MoneyTotal[];
  } | null;
  highlights: CashflowHighlights[];
  receivables: {
    unpaid: MoneyTotal[];
    overdue: MoneyTotal[];
    unpaidCount: number;
    overdueCount: number;
  };
  toConfirm: {
    id: string;
    kind: TransactionKind;
    description: string;
    clientName: string | null;
    dayOfMonth: number;
    dueDate: string;
    amountMinor: number;
    currency: Currency;
    categoryIcon: string | null;
  }[];
  waiting: {
    id: string;
    number: string | null;
    clientName: string;
    description: string | null;
    periodStart: string | null;
    dueDate: string;
    amountMinor: number;
    currency: Currency;
    status: InvoiceStatus;
    daysOverdue: number;
  }[];
  cashflow: CurrencyCashflow[];
  categories: {
    /** null for Garage's car costs. */
    categoryId: string | null;
    name: string;
    icon: string | null;
    systemKey: "invoices" | null;
    currency: Currency;
    amountMinor: number;
    sharePercent: number;
    /** Amount per bucket, aligned with `buckets`. */
    trend: number[];
  }[];
  recent: {
    id: string;
    kind: TransactionKind;
    date: string;
    description: string;
    amountMinor: number;
    currency: Currency;
    category: {
      name: string;
      icon: string | null;
      systemKey: "invoices" | null;
    };
    clientName: string | null;
  }[];
  monthSoFar: { income: MoneyTotal[]; expense: MoneyTotal[] };
}

export const toFinanceOverviewResponse = (
  overview: FinanceOverview
): FinanceOverviewResponse => ({
  allTime: overview.allTime,
  buckets: overview.buckets,
  cashflow: overview.cashflow,
  categories: overview.categories.map((share) => ({
    amountMinor: share.amountMinor,
    categoryId: share.categoryId === CAR_COSTS ? null : share.categoryId,
    currency: share.currency,
    icon: share.icon,
    name: share.name,
    sharePercent: share.sharePercent,
    systemKey: share.systemKey,
    trend: share.trend,
  })),
  earned: overview.earned,
  granularity: overview.granularity,
  hasData: overview.hasData,
  highlights: overview.highlights,
  monthSoFar: overview.monthSoFar,
  previous:
    overview.previous === null
      ? null
      : {
          earned: overview.previous.earned,
          range: overview.previous.range,
          spent: overview.previous.spent,
        },
  range: overview.range,
  receivables: {
    overdue: overview.receivables.overdue,
    overdueCount: overview.receivables.overdueCount,
    unpaid: overview.receivables.unpaid,
    unpaidCount: overview.receivables.unpaidCount,
  },
  recent: overview.recent.map((row) => ({
    amountMinor: row.amountMinor,
    category: {
      icon: row.category.icon,
      name: row.category.name,
      systemKey: row.category.systemKey,
    },
    clientName: row.client?.name ?? null,
    currency: row.currency,
    date: row.date,
    description: row.description,
    id: row.id,
    kind: row.kind,
  })),
  spent: overview.spent,
  toConfirm: overview.toConfirm.map((item) => ({
    amountMinor: item.amountMinor,
    categoryIcon: item.categoryIcon,
    clientName: item.clientName,
    currency: item.currency,
    dayOfMonth: item.dayOfMonth,
    description: item.description,
    dueDate: item.dueDate,
    id: item.id,
    kind: item.kind,
  })),
  today: overview.today,
  waiting: overview.waiting.map((invoice) => ({
    amountMinor: invoice.amountMinor,
    clientName: invoice.clientName,
    currency: invoice.currency,
    daysOverdue: invoice.daysOverdue,
    description: invoice.description,
    dueDate: invoice.dueDate,
    id: invoice.id,
    number: invoice.number,
    periodStart: invoice.periodStart,
    status: invoice.displayStatus,
  })),
  years: overview.years,
});
