import { addMonths, isIsoDate } from "@shared/domain/dates";
import { wholeYear } from "@shared/domain/finances/period";
import type { DateRange } from "@shared/domain/finances/period";
import { z } from "zod";

import { ALL_YEARS } from "../transactions/transactions-search";
import type { TransactionsSearch } from "../transactions/transactions-search";

/** "Last 12 months" (rolling, up to today). */
export const LAST_12_MONTHS = "12m";

const isoDateParam = z
  .string()
  .refine((value) => isIsoDate(value))
  .optional()
  .catch(undefined);

/**
 * Overview filters in the URL. Nothing set means all time, every category and client.
 * The period is one of: `from` + `to` (custom), `year`, or `range=12m`.
 */
export const overviewSearchSchema = z.object({
  category: z.string().min(1).optional().catch(undefined),
  client: z.string().min(1).optional().catch(undefined),
  from: isoDateParam,
  range: z.literal(LAST_12_MONTHS).optional().catch(undefined),
  to: isoDateParam,
  year: z.coerce.number().int().min(1990).max(2200).optional().catch(undefined),
});

export type OverviewSearch = z.infer<typeof overviewSearchSchema>;

/** What the overview endpoint is asked for (also its query key). */
export interface OverviewFilter {
  from?: string;
  to?: string;
  categoryId?: string;
  clientId?: string;
}

/** The period the search picks, or null for all time. */
export const periodOf = (
  search: OverviewSearch,
  today: string
): DateRange | null => {
  if (
    search.from !== undefined &&
    search.to !== undefined &&
    search.from <= search.to
  ) {
    return { from: search.from, to: search.to };
  }

  if (search.year !== undefined) {
    return { from: `${search.year}-01-01`, to: `${search.year}-12-31` };
  }

  if (search.range === LAST_12_MONTHS) {
    return { from: addMonths(`${today.slice(0, 7)}-01`, -11), to: today };
  }

  return null;
};

export const filterOf = (
  search: OverviewSearch,
  today: string
): OverviewFilter => {
  const period = periodOf(search, today);
  const filter: OverviewFilter = {};

  if (period !== null) {
    filter.from = period.from;
    filter.to = period.to;
  }

  if (search.category !== undefined) {
    filter.categoryId = search.category;
  }

  if (search.client !== undefined) {
    filter.clientId = search.client;
  }

  return filter;
};

export const hasOverviewFilters = (search: OverviewSearch): boolean =>
  Object.values(search).some((value) => value !== undefined);

/** A change to the filters; `null` removes a key from the URL. */
export type OverviewPatch = {
  [K in keyof OverviewSearch]?: OverviewSearch[K] | null;
};

/** Spread before a new period so only one period key is left in the URL. */
export const NO_PERIOD = {
  from: null,
  range: null,
  to: null,
  year: null,
} satisfies OverviewPatch;

const patched = <T>(
  next: T | null | undefined,
  current: T | undefined
): T | undefined => (next === null ? undefined : (next ?? current));

export const applyOverviewPatch = (
  search: OverviewSearch,
  patch: OverviewPatch
): OverviewSearch => ({
  category: patched(patch.category, search.category),
  client: patched(patch.client, search.client),
  from: patched(patch.from, search.from),
  range: patched(patch.range, search.range),
  to: patched(patch.to, search.to),
  year: patched(patch.year, search.year),
});

/**
 * Transactions-page search that shows the entries behind a figure: the same client and
 * category, within `range` (a whole year as `year`, anything else as `from` / `to`).
 */
export const transactionsSearchFor = (
  search: OverviewSearch,
  range: DateRange | null,
  extra: Pick<TransactionsSearch, "category" | "kind"> = {}
): TransactionsSearch => {
  const year = range === null ? null : wholeYear(range);
  let period: TransactionsSearch = { year: ALL_YEARS };

  if (year !== null) {
    period = { year };
  } else if (range !== null) {
    period = { from: range.from, to: range.to };
  }

  return {
    category: extra.category ?? search.category,
    client: search.client,
    kind: extra.kind,
    ...period,
  };
};
