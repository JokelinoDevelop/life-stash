import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useEffect, useEffectEvent, useRef } from "react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import type { PageSlice } from "@/lib/paginate";

import { useIsDesktop } from "./responsive-dialog";

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

/** Phones: long lists grow as you scroll (`paginate(…, growing)`); desktop turns pages. */
export const useGrowingList = (): boolean => !useIsDesktop();

/**
 * Phones: the end of a growing list. Coming into view loads the next page (the button is
 * the same action for keyboards, screen readers, or if the observer never fires).
 */
const LoadOlder = ({
  loading,
  onLoad,
}: {
  loading: boolean;
  onLoad: () => void;
}) => {
  const { t } = useTranslation();
  const sentinel = useRef<HTMLDivElement>(null);
  const load = useEffectEvent(onLoad);

  useEffect(() => {
    const element = sentinel.current;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting === true) {
          load();
        }
      },
      { rootMargin: "400px 0px" }
    );

    if (element !== null && !loading) {
      observer.observe(element);
    }

    return () => {
      observer.disconnect();
    };
  }, [loading]);

  return (
    <div className="flex justify-center" ref={sentinel}>
      <Button
        disabled={loading}
        onClick={onLoad}
        size="compact"
        type="button"
        variant="ghost"
      >
        {loading && <Loader2 className="animate-spin" />}
        {t("pagination.loadOlder")}
      </Button>
    </div>
  );
};

/**
 * A paginated block inside a `PageStack`: the page's list sections, then the
 * pager. Turning the page scrolls back to the top of the list if it is above
 * the viewport, so you never land mid-page. Phones: the list grows as you
 * scroll instead (pass a `growing` slice), with no pager.
 */
export const PagedList = ({
  children,
  loading = false,
  onPageChange,
  slice,
}: {
  children: ReactNode;
  /** Phones: the next page is on its way (server-paged lists). */
  loading?: boolean;
  onPageChange: (page: number) => void;
  slice: Pick<
    PageSlice<unknown>,
    "end" | "page" | "pageCount" | "start" | "total"
  >;
}) => {
  const top = useRef<HTMLDivElement>(null);
  const growing = useGrowingList();

  const turn = (page: number) => {
    onPageChange(page);
    const anchor = top.current;

    if (anchor !== null && anchor.getBoundingClientRect().top < 0) {
      anchor.scrollIntoView({ block: "start" });
    }
  };

  if (growing) {
    return (
      <div className="flex flex-col gap-6" data-bleed="">
        {children}
        {slice.page < slice.pageCount && (
          <LoadOlder
            loading={loading}
            onLoad={() => {
              onPageChange(slice.page + 1);
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div
      className="flex scroll-mt-14 flex-col gap-6 md:gap-0"
      data-bleed=""
      ref={top}
    >
      {/* Keyed by page: a new page swaps in at once instead of animating every
          row out and in (rows still animate when the page's data changes). */}
      <div className="contents" key={slice.page}>
        {children}
      </div>
      {slice.pageCount > 1 && (
        <div className="md:mx-5 md:my-4">
          <ListPagination onPageChange={turn} slice={slice} />
        </div>
      )}
    </div>
  );
};
