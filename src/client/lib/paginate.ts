/** Rows per page on long lists (car tabs, household history). */
export const LIST_PAGE_SIZE = 12;

export interface PageSlice<T> {
  items: T[];
  /** The page shown, clamped to `1…pageCount`. */
  page: number;
  pageCount: number;
  /** 1-based position of the first and last row shown (0 when empty). */
  start: number;
  end: number;
  total: number;
}

/** One page of `items`. Out-of-range pages (e.g. after a delete) show the nearest page. */
export const paginate = <T>(
  items: readonly T[],
  page: number,
  pageSize: number = LIST_PAGE_SIZE
): PageSlice<T> => {
  const total = items.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(Math.max(1, Math.trunc(page)), pageCount);
  const offset = (current - 1) * pageSize;
  const slice = items.slice(offset, offset + pageSize);

  return {
    end: offset + slice.length,
    items: slice,
    page: current,
    start: total === 0 ? 0 : offset + 1,
    pageCount,
    total,
  };
};
