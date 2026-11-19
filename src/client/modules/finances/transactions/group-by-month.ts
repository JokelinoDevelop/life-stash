import { monthOf } from "@shared/domain/finances/kinds";
import type { MoneyTotal } from "@shared/domain/money";

export interface MonthSummary {
  month: string;
  entries: number;
  income: MoneyTotal[];
  expense: MoneyTotal[];
}

export interface MonthGroup<Row> {
  month: string;
  rows: Row[];
  /** Totals of the whole month across all pages (from the API), if known. */
  summary: MonthSummary | undefined;
}

/** Splits loaded rows (newest first) into month groups, attaching each month's full totals. */
export const groupByMonth = <Row extends { date: string }>(
  rows: readonly Row[],
  summaries: readonly MonthSummary[]
): MonthGroup<Row>[] => {
  const groups: MonthGroup<Row>[] = [];
  const byMonth = new Map(summaries.map((summary) => [summary.month, summary]));

  for (const row of rows) {
    const month = monthOf(row.date);
    const last = groups.at(-1);

    if (last?.month === month) {
      last.rows.push(row);
    } else {
      groups.push({
        month,
        rows: [row],
        summary: byMonth.get(month),
      });
    }
  }

  return groups;
};

/** Income minus spending per currency (currencies with neither are left out). */
export const netByCurrency = (summary: MonthSummary): MoneyTotal[] => {
  const net = new Map<MoneyTotal["currency"], number>();

  for (const total of summary.income) {
    net.set(total.currency, (net.get(total.currency) ?? 0) + total.amountMinor);
  }

  for (const total of summary.expense) {
    net.set(total.currency, (net.get(total.currency) ?? 0) - total.amountMinor);
  }

  return [...net.entries()].map(([currency, amountMinor]) => ({
    amountMinor,
    currency,
  }));
};
