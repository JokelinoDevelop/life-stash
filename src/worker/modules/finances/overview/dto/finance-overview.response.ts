import type { CurrencyCashflow } from "@shared/domain/finances/cashflow";
import type { InvoiceStatus } from "@shared/domain/finances/invoices";
import type { TransactionKind } from "@shared/domain/finances/kinds";
import type { Currency, MoneyTotal } from "@shared/domain/money";

import type { FinanceOverview } from "../overview.service";
import { CAR_COSTS } from "../overview.service";

export interface FinanceOverviewResponse {
  year: number;
  today: string;
  hasData: boolean;
  earned: MoneyTotal[];
  earnedLastYear: MoneyTotal[];
  spent: MoneyTotal[];
  monthsElapsed: number;
  receivables: {
    unpaid: MoneyTotal[];
    overdue: MoneyTotal[];
    unpaidCount: number;
    overdueCount: number;
  };
  waiting: {
    id: string;
    number: string;
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
  cashflow: overview.cashflow,
  categories: overview.categories.map((share) => ({
    amountMinor: share.amountMinor,
    categoryId: share.categoryId === CAR_COSTS ? null : share.categoryId,
    currency: share.currency,
    icon: share.icon,
    name: share.name,
    sharePercent: share.sharePercent,
    systemKey: share.systemKey,
  })),
  earned: overview.earned,
  earnedLastYear: overview.earnedLastYear,
  hasData: overview.hasData,
  monthSoFar: overview.monthSoFar,
  monthsElapsed: overview.monthsElapsed,
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
  year: overview.year,
});
