import { TRANSACTION_KINDS } from "@shared/domain/finances/kinds";
import { z } from "zod";

import type { TransactionFilter } from "./transaction-filter";

/** "all" shows every year; no `year` in the URL means the current year. */
export const ALL_YEARS = "all";

export const transactionsSearchSchema = z.object({
  category: z.string().min(1).optional().catch(undefined),
  client: z.string().min(1).optional().catch(undefined),
  kind: z.enum(TRANSACTION_KINDS).optional().catch(undefined),
  q: z.string().max(100).optional().catch(undefined),
  year: z
    .union([z.literal(ALL_YEARS), z.coerce.number().int().min(1990).max(2200)])
    .optional()
    .catch(undefined),
});

export type TransactionsSearch = z.infer<typeof transactionsSearchSchema>;

/** A change to the filters; `null` removes a key from the URL. */
export type SearchPatch = {
  [K in keyof TransactionsSearch]?: TransactionsSearch[K] | null;
};

/** Applies a patch; keys set to null are dropped from the URL. */
/** The patched value: null clears, undefined keeps the current one. */
const patched = <T>(
  next: T | null | undefined,
  current: T | undefined
): T | undefined => (next === null ? undefined : (next ?? current));

/** Applies a patch; keys set to null are dropped from the URL. */
export const applySearchPatch = (
  search: TransactionsSearch,
  patch: SearchPatch
): TransactionsSearch => ({
  category: patched(patch.category, search.category),
  client: patched(patch.client, search.client),
  kind: patched(patch.kind, search.kind),
  q: patched(patch.q, search.q),
  year: patched(patch.year, search.year),
});

/** The API filter for the page's search params. */
export const filterFromSearch = (
  search: TransactionsSearch,
  currentYear: number
): TransactionFilter => {
  const year = search.year ?? currentYear;
  const filter: TransactionFilter = {};

  if (year !== ALL_YEARS) {
    filter.from = `${year}-01-01`;
    filter.to = `${year}-12-31`;
  }

  if (search.kind !== undefined) {
    filter.kind = search.kind;
  }

  if (search.category !== undefined) {
    filter.categoryId = search.category;
  }

  if (search.client !== undefined) {
    filter.clientId = search.client;
  }

  const q = search.q?.trim();

  if (q !== undefined && q !== "") {
    filter.q = q;
  }

  return filter;
};

export const hasActiveFilters = (search: TransactionsSearch): boolean => {
  const narrowed = [
    search.kind,
    search.category,
    search.client,
    search.year,
  ].some((value) => value !== undefined);

  return narrowed || (search.q ?? "").trim() !== "";
};
