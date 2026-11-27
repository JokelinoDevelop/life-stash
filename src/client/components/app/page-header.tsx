import { ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { SettingsAvatar } from "./settings-avatar";

/** Height of the phone top row (min-h-11), where the compact title appears. */
const TOP_ROW = 44;

/**
 * Phones: the top row (back or `mobileTop`, actions) sticks to the top, and
 * once the large title has scrolled under it the title appears there, small
 * and centred — the iOS large-title pattern.
 */
const MobileHeader = ({
  account,
  actions,
  back,
  description,
  eyebrow,
  hideMobileTitle,
  mobileTop,
  title,
}: {
  account: boolean;
  actions?: ReactNode;
  back?: ReactNode;
  description?: ReactNode;
  eyebrow?: ReactNode;
  hideMobileTitle: boolean;
  mobileTop?: ReactNode;
  title: ReactNode;
}) => {
  const sentinel = useRef<HTMLDivElement>(null);
  const [compact, setCompact] = useState(false);

  const hasTopRow =
    account || [back, mobileTop, actions].some((slot) => slot !== undefined);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setCompact(
          entry !== undefined &&
            !entry.isIntersecting &&
            entry.boundingClientRect.top < TOP_ROW
        );
      },
      { rootMargin: `-${TOP_ROW}px 0px 0px 0px` }
    );

    if (sentinel.current !== null) {
      observer.observe(sentinel.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    // `contents`, so the top row sticks for the whole page, not just while the header is in view.
    <header className="contents md:hidden">
      {hasTopRow && (
        <div
          className={cn(
            "bg-background/85 sticky top-0 z-20 -mx-4 flex min-h-11 items-center justify-between gap-2 border-b px-3 backdrop-blur-md transition-colors duration-200 md:hidden",
            hideMobileTitle ? "mb-5" : "mb-2",
            compact ? "border-divider" : "border-transparent"
          )}
        >
          <div
            className={cn(
              "flex min-w-0 items-center transition-opacity duration-200",
              compact && mobileTop !== undefined && "opacity-0"
            )}
          >
            {mobileTop ?? back}
          </div>
          <p
            aria-hidden="true"
            className={cn(
              "pointer-events-none absolute inset-x-20 truncate text-center text-sm font-semibold transition-opacity duration-200",
              compact ? "opacity-100" : "opacity-0"
            )}
          >
            {title}
          </p>
          {(actions !== undefined || account) && (
            <div className="flex shrink-0 items-center gap-1">
              {actions}
              {account && <SettingsAvatar />}
            </div>
          )}
        </div>
      )}
      {!hideMobileTitle && (
        <div className="md:hidden">
          {eyebrow !== undefined && (
            <p className="text-muted-foreground mb-0.5 text-xs font-semibold tracking-wide uppercase">
              {eyebrow}
            </p>
          )}
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {description !== undefined && (
            <p className="text-muted-foreground mt-0.5 text-sm">
              {description}
            </p>
          )}
        </div>
      )}
      <div aria-hidden="true" className="mb-5 md:hidden" ref={sentinel} />
    </header>
  );
};

/**
 * Desktop: a 44px bar at the top of the content panel (crumb › title, actions).
 * Phones: a top row (back or `mobileTop`, actions) above a large title.
 */
export const PageHeader = ({
  account = false,
  actions,
  back,
  description,
  desktopTitle,
  eyebrow,
  hideMobileTitle = false,
  mobileTop,
  title,
}: {
  /** Phones: your avatar in the top row, opening Settings (module homes; Settings has no tab). */
  account?: boolean;
  actions?: ReactNode;
  back?: ReactNode;
  description?: ReactNode;
  /** Bar title on desktop when it differs from the phone title. */
  desktopTitle?: ReactNode;
  /** Phones: a small line above the large title (Today's date). */
  eyebrow?: ReactNode;
  hideMobileTitle?: boolean;
  mobileTop?: ReactNode;
  title: ReactNode;
}) => (
  <>
    <header className="border-divider bg-card sticky top-0 z-20 hidden h-11 items-center gap-1.5 rounded-t-lg border-b pr-3 pl-5 md:flex">
      {back !== undefined && (
        <>
          {back}
          <ChevronRight
            aria-hidden="true"
            className="text-muted-foreground/60 size-3.5 shrink-0"
          />
        </>
      )}
      <h1 className="truncate text-sm font-medium">{desktopTitle ?? title}</h1>
      {actions !== undefined && (
        <div className="ml-auto flex shrink-0 items-center gap-1.5">
          {actions}
        </div>
      )}
    </header>
    <MobileHeader
      account={account}
      actions={actions}
      back={back}
      description={description}
      eyebrow={eyebrow}
      hideMobileTitle={hideMobileTitle}
      mobileTop={mobileTop}
      title={title}
    />
  </>
);

/** Padded, full-width content for form and settings pages (the desktop panel has no padding). */
export const PageContent = ({ children }: { children: ReactNode }) => (
  <div className="flex flex-col gap-6 md:px-7 md:py-6">{children}</div>
);

/**
 * Content made of list sections: inset boxes on phones, full-bleed bands on
 * desktop. Children without `data-bleed` get a desktop margin.
 */
export const PageStack = ({ children }: { children: ReactNode }) => (
  <div className="flex flex-col gap-6 md:gap-0 md:[&>:not([data-bleed])]:mx-5 md:[&>:not([data-bleed])]:my-4">
    {children}
  </div>
);
