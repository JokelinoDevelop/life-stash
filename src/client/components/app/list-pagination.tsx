import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef } from "react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import type { PageSlice } from "@/lib/paginate";

/** "‹ Newer   13–24 of 84   Older ›" under a newest-first list. */
export const ListPagination = ({
  onPageChange,
  slice,
}: {
  onPageChange: (page: number) => void;
  slice: Pick<
    PageSlice<unknown>,
    "end" | "page" | "pageCount" | "start" | "total"
  >;
}) => {
  const { t } = useTranslation();

  if (slice.pageCount <= 1) {
    return null;
  }

  return (
    <nav
      aria-label={t("pagination.label")}
      className="flex items-center justify-between gap-2"
    >
      <Button
        disabled={slice.page <= 1}
        onClick={() => {
          onPageChange(slice.page - 1);
        }}
        size="compact"
        variant="outline"
      >
        <ChevronLeft />
        {t("pagination.newer")}
      </Button>
      <span
        aria-live="polite"
        className="text-muted-foreground text-xs tabular-nums"
      >
        {t("pagination.range", {
          end: slice.end,
          start: slice.start,
          total: slice.total,
        })}
      </span>
      <Button
        disabled={slice.page >= slice.pageCount}
        onClick={() => {
          onPageChange(slice.page + 1);
        }}
        size="compact"
        variant="outline"
      >
        {t("pagination.older")}
        <ChevronRight />
      </Button>
    </nav>
  );
};

/**
 * A paginated block inside a `PageStack`: the page's list sections, then the
 * pager. Turning the page scrolls back to the top of the list if it is above
 * the viewport, so you never land mid-page.
 */
export const PagedList = ({
  children,
  onPageChange,
  slice,
}: {
  children: ReactNode;
  onPageChange: (page: number) => void;
  slice: Pick<
    PageSlice<unknown>,
    "end" | "page" | "pageCount" | "start" | "total"
  >;
}) => {
  const top = useRef<HTMLDivElement>(null);

  const turn = (page: number) => {
    onPageChange(page);
    const anchor = top.current;

    if (anchor !== null && anchor.getBoundingClientRect().top < 0) {
      anchor.scrollIntoView({ block: "start" });
    }
  };

  return (
    <div
      className="flex scroll-mt-14 flex-col gap-6 md:gap-0"
      data-bleed=""
      ref={top}
    >
      {children}
      {slice.pageCount > 1 && (
        <div className="md:mx-5 md:my-4">
          <ListPagination onPageChange={turn} slice={slice} />
        </div>
      )}
    </div>
  );
};
